const fs = require('fs');
const liquidacionModel = require('../models/liquidacion.model');
const empleadoModel = require('../models/empleado.model');
const contratoModel = require('../models/contrato.model');
const asistenciaModel = require('../models/asistencia.model');
const { calcularSobrejornadaSemanal } = require('./horasTrabajadas.service');
const { calcularHorasExtra } = require('./horasExtra.service');
const {
  calcularGratificacion,
  calcularDescuentoAfp,
  calcularDescuentoSalud,
  calcularDescuentoCesantia,
} = require('./liquidacionCalculo.service');
const { calcularImpuestoUnico } = require('../utils/impuestoUnico');
const configuracionService = require('./configuracion.service');
const { generarPdfLiquidacion, rutaArchivo, nombreArchivo } = require('./liquidacionPdf.service');
const { esPeriodoValido, obtenerBloquesSemanalesDelPeriodo } = require('../utils/periodo');
const { slugificar } = require('../utils/slug');
const { paginar } = require('../utils/paginacion');

class ServiceError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function listarLiquidaciones(opciones) {
  return liquidacionModel.findAll(opciones);
}

async function obtenerLiquidacion(id) {
  const liquidacion = await liquidacionModel.findById(id);
  if (!liquidacion) throw new ServiceError(404, 'Liquidación no encontrada');
  return liquidacion;
}

/** Suma la sobrejornada (RF-07) de cada bloque semanal del período completo. */
async function calcularHorasSobrejornadaDelPeriodo(empleadoId, periodo) {
  const bloques = obtenerBloquesSemanalesDelPeriodo(periodo);
  let total = 0;
  for (const bloque of bloques) {
    const registros = await asistenciaModel.findAll({
      empleadoId,
      desde: bloque.desde,
      hasta: bloque.hasta,
    });
    const horasPorDia = registros.map((r) => r.horas_trabajadas);
    total += calcularSobrejornadaSemanal(horasPorDia).horasSobrejornada;
  }
  return Math.round(total * 100) / 100;
}

/**
 * Genera y persiste la liquidación de sueldo de un empleado para un período,
 * orquestando el cálculo de horas extra (RF-07/RF-08) y las cotizaciones/gratificación
 * legales. Un período solo puede liquidarse una vez por empleado.
 */
async function generarLiquidacion({ empleado_id, periodo, generado_por }) {
  if (!empleado_id || !periodo) {
    throw new ServiceError(400, 'Los campos "empleado_id" y "periodo" son obligatorios');
  }
  if (!esPeriodoValido(periodo)) {
    throw new ServiceError(400, 'El período debe tener el formato "YYYY-MM"');
  }

  const empleado = await empleadoModel.findById(empleado_id);
  if (!empleado) throw new ServiceError(404, 'Empleado no encontrado');

  const existente = await liquidacionModel.findByEmpleadoPeriodo(empleado_id, periodo);
  if (existente) {
    throw new ServiceError(409, 'Ya existe una liquidación generada para este empleado y período');
  }

  const contrato = await contratoModel.findActivoByEmpleado(empleado_id);
  if (!contrato) {
    throw new ServiceError(400, 'El empleado no tiene un contrato activo; no se puede liquidar');
  }

  const sueldoBase = Number(empleado.sueldo_base);
  const horasSobrejornada = await calcularHorasSobrejornadaDelPeriodo(empleado_id, periodo);
  const { montoHorasExtra } = calcularHorasExtra({ sueldoBase, horasSobrejornada });

  const config = await configuracionService.obtenerConfiguracion();
  const tramosImpuesto = await configuracionService.listarTramosImpuesto();

  // Base imponible de la gratificación: sueldo base + horas extra del período.
  const gratificacion = calcularGratificacion(
    sueldoBase + montoHorasExtra,
    Number(config.gratificacion_porcentaje),
    Number(config.gratificacion_tope_mensual),
  );

  // Haberes imponibles: cotizan AFP/salud/cesantía y son la base del impuesto único.
  const totalImponible = sueldoBase + montoHorasExtra + gratificacion;
  const descuentoAfp = calcularDescuentoAfp(totalImponible, Number(config.afp_porcentaje));
  const descuentoSalud = calcularDescuentoSalud(totalImponible, Number(config.salud_porcentaje));
  const descuentoCesantia = calcularDescuentoCesantia(
    totalImponible,
    contrato.tipo,
    Number(config.afc_indefinido_porcentaje),
    Number(config.afc_plazo_fijo_porcentaje),
  );

  // Impuesto único: se calcula sobre la base tributable (imponible menos las
  // cotizaciones de AFP y salud, que son deducibles), no sobre el total imponible.
  const baseTributable = totalImponible - descuentoAfp - descuentoSalud;
  const descuentoImpuesto = calcularImpuestoUnico(baseTributable, tramosImpuesto, Number(config.valor_utm));

  // Movilización y colación: haberes no imponibles (montos fijos), no cotizan ni
  // tributan — se suman después de calcular AFP/salud/cesantía/impuesto.
  const movilizacion = Number(config.movilizacion_monto);
  const colacion = Number(config.colacion_monto);

  const totalHaberes = totalImponible + movilizacion + colacion;
  const totalDescuentos = descuentoAfp + descuentoSalud + descuentoCesantia + descuentoImpuesto;
  const liquidoPagar = totalHaberes - totalDescuentos;

  return liquidacionModel.create({
    empleado_id,
    generado_por,
    periodo,
    sueldo_base: sueldoBase,
    horas_extra_monto: montoHorasExtra,
    gratificacion,
    movilizacion,
    colacion,
    descuento_afp: descuentoAfp,
    descuento_salud: descuentoSalud,
    descuento_cesantia: descuentoCesantia,
    descuento_impuesto: descuentoImpuesto,
    otros_descuentos: 0,
    total_haberes: totalHaberes,
    total_descuentos: totalDescuentos,
    liquido_pagar: liquidoPagar,
  });
}

/**
 * Devuelve la ruta en disco del PDF de una liquidación, generándolo si aún no existe
 * (la primera descarga lo crea y guarda `pdf_url`; las siguientes reutilizan el archivo).
 */
async function obtenerPdfLiquidacion(id) {
  const liquidacion = await obtenerLiquidacion(id);
  const empleado = await empleadoModel.findById(liquidacion.empleado_id);

  // El nombre del archivo guardado en disco (clave de caché) no cambia, pero el nombre
  // que ve el usuario al descargar sí incluye al empleado, no solo el período.
  const nombreDescarga = `liquidacion-${liquidacion.periodo}-${slugificar(empleado.nombre)}-${slugificar(empleado.apellido)}.pdf`;

  if (liquidacion.pdf_url && fs.existsSync(rutaArchivo(liquidacion))) {
    return { ruta: rutaArchivo(liquidacion), nombre: nombreDescarga };
  }

  const contratos = await contratoModel.findAll({ empleadoId: liquidacion.empleado_id });
  const ruta = await generarPdfLiquidacion(liquidacion, empleado, contratos[0] || null);
  const pdfUrl = `/uploads/liquidaciones/${nombreArchivo(liquidacion)}`;
  await liquidacionModel.actualizarPdfUrl(id, pdfUrl);

  return { ruta, nombre: nombreDescarga };
}

/**
 * RF-13: historial de remuneraciones de un empleado, con filtro opcional de rango de
 * períodos ("YYYY-MM"), más un resumen agregado (cantidad y promedio del líquido
 * pagado en el rango).
 */
async function obtenerHistorialRemuneraciones({ empleadoId, desde, hasta, pagina, porPagina }) {
  if (!empleadoId) {
    throw new ServiceError(400, 'El parámetro "empleado_id" es obligatorio');
  }
  if (desde && !esPeriodoValido(desde)) {
    throw new ServiceError(400, 'El parámetro "desde" debe tener el formato "YYYY-MM"');
  }
  if (hasta && !esPeriodoValido(hasta)) {
    throw new ServiceError(400, 'El parámetro "hasta" debe tener el formato "YYYY-MM"');
  }
  if (desde && hasta && desde > hasta) {
    throw new ServiceError(400, 'El parámetro "desde" no puede ser posterior a "hasta"');
  }

  const empleado = await empleadoModel.findById(empleadoId);
  if (!empleado) throw new ServiceError(404, 'Empleado no encontrado');

  const liquidaciones = await liquidacionModel.findAll({ empleadoId, desde, hasta });

  // Los agregados (cantidad, promedio) se calculan sobre todo el rango filtrado, no
  // solo sobre la página actual — paginar es solo para no listar cientos de filas.
  const cantidad = liquidaciones.length;
  const totalLiquido = liquidaciones.reduce((acc, l) => acc + Number(l.liquido_pagar), 0);
  const promedioLiquido = cantidad > 0 ? Math.round(totalLiquido / cantidad) : 0;
  const paginaDeLiquidaciones = paginar(liquidaciones, { pagina, porPagina });

  return {
    empleado: { id: empleado.id, nombre: empleado.nombre, apellido: empleado.apellido, rut: empleado.rut },
    desde: desde || null,
    hasta: hasta || null,
    cantidad,
    totalLiquido: Math.round(totalLiquido),
    promedioLiquido,
    liquidaciones: paginaDeLiquidaciones.datos,
    pagina: paginaDeLiquidaciones.pagina,
    porPagina: paginaDeLiquidaciones.porPagina,
    totalPaginas: paginaDeLiquidaciones.totalPaginas,
  };
}

module.exports = {
  ServiceError,
  listarLiquidaciones,
  obtenerLiquidacion,
  generarLiquidacion,
  obtenerPdfLiquidacion,
  obtenerHistorialRemuneraciones,
};
