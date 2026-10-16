const asistenciaModel = require('../models/asistencia.model');
const empleadoModel = require('../models/empleado.model');
const {
  calcularHorasTrabajadas,
  calcularSobrejornadaSemanal,
} = require('./horasTrabajadas.service');
const { calcularHorasExtra } = require('./horasExtra.service');
const { esPeriodoValido, rangoDelPeriodo, obtenerBloquesSemanalesDelPeriodo } = require('../utils/periodo');

class ServiceError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function asegurarEmpleadoExiste(empleadoId) {
  const empleado = await empleadoModel.findById(empleadoId);
  if (!empleado) throw new ServiceError(404, 'Empleado no encontrado');
  return empleado;
}

async function listarAsistencia(opciones) {
  return asistenciaModel.findAll(opciones);
}

async function obtenerAsistencia(id) {
  const registro = await asistenciaModel.findById(id);
  if (!registro) throw new ServiceError(404, 'Registro de asistencia no encontrado');
  return registro;
}

async function registrarEntrada({ empleado_id, fecha, hora_entrada }) {
  if (!empleado_id || !fecha || !hora_entrada) {
    throw new ServiceError(400, 'Los campos "empleado_id", "fecha" y "hora_entrada" son obligatorios');
  }
  await asegurarEmpleadoExiste(empleado_id);

  const existente = await asistenciaModel.findByEmpleadoFecha(empleado_id, fecha);
  if (existente) {
    throw new ServiceError(409, 'Ya existe un registro de asistencia para este empleado en esta fecha');
  }

  return asistenciaModel.crearMarcajeEntrada({ empleado_id, fecha, hora_entrada });
}

async function registrarSalida(id, { hora_salida }) {
  const registro = await obtenerAsistencia(id);

  if (!hora_salida) {
    throw new ServiceError(400, 'El campo "hora_salida" es obligatorio');
  }
  if (registro.ausente) {
    throw new ServiceError(400, 'No se puede marcar salida en un día registrado como ausencia');
  }
  if (!registro.hora_entrada) {
    throw new ServiceError(400, 'El registro no tiene hora de entrada marcada');
  }
  if (registro.hora_salida) {
    throw new ServiceError(409, 'Este registro ya tiene una hora de salida marcada');
  }

  const horasTrabajadas = calcularHoras(registro.hora_entrada, hora_salida);
  return asistenciaModel.marcarSalida(id, hora_salida, horasTrabajadas);
}

/** Envuelve calcularHorasTrabajadas traduciendo su error a un ServiceError 400. */
function calcularHoras(horaEntrada, horaSalida) {
  try {
    return calcularHorasTrabajadas(horaEntrada, horaSalida);
  } catch (err) {
    throw new ServiceError(400, err.message);
  }
}

/**
 * Suma las horas trabajadas de un empleado en un rango de fechas, detecta sobrejornada
 * (RF-07) y calcula el monto de horas extra a pagar sobre su sueldo base (RF-08).
 */
async function obtenerResumenSemanal({ empleadoId, desde, hasta }) {
  if (!empleadoId || !desde || !hasta) {
    throw new ServiceError(400, 'Los parámetros "empleado_id", "desde" y "hasta" son obligatorios');
  }
  const empleado = await asegurarEmpleadoExiste(empleadoId);

  const registros = await asistenciaModel.findAll({ empleadoId, desde, hasta });
  const horasPorDia = registros.map((r) => r.horas_trabajadas);
  const resumenHoras = calcularSobrejornadaSemanal(horasPorDia);

  const { valorHoraOrdinaria, montoHorasExtra } = calcularHorasExtra({
    sueldoBase: Number(empleado.sueldo_base),
    horasSobrejornada: resumenHoras.horasSobrejornada,
  });

  return { ...resumenHoras, valorHoraOrdinaria, montoHorasExtra };
}

async function registrarAusencia({ empleado_id, fecha, justificacion }) {
  if (!empleado_id || !fecha || !justificacion) {
    throw new ServiceError(
      400,
      'Los campos "empleado_id", "fecha" y "justificacion" son obligatorios',
    );
  }
  await asegurarEmpleadoExiste(empleado_id);

  const existente = await asistenciaModel.findByEmpleadoFecha(empleado_id, fecha);
  if (existente) {
    throw new ServiceError(409, 'Ya existe un registro de asistencia para este empleado en esta fecha');
  }

  return asistenciaModel.crearAusencia({ empleado_id, fecha, justificacion });
}

/**
 * Corrige un registro de asistencia ya creado (error de tipeo en la hora, justificación,
 * etc.). Solo se pueden modificar hora_entrada, hora_salida, ausente y justificacion —
 * no la fecha ni el empleado, para no romper la unicidad empleado+fecha.
 */
async function actualizarAsistencia(id, datos) {
  const registro = await obtenerAsistencia(id);
  const ausente = datos.ausente !== undefined ? Boolean(datos.ausente) : registro.ausente;
  const justificacion =
    datos.justificacion !== undefined ? datos.justificacion : registro.justificacion;

  if (ausente) {
    if (datos.hora_entrada || datos.hora_salida) {
      throw new ServiceError(
        400,
        'Un registro marcado como ausente no puede tener hora de entrada ni de salida',
      );
    }
    if (!justificacion) {
      throw new ServiceError(400, 'Debe indicar una justificación para marcar el registro como ausente');
    }
    return asistenciaModel.actualizar(id, {
      hora_entrada: null,
      hora_salida: null,
      horas_trabajadas: null,
      ausente: true,
      justificacion,
    });
  }

  const horaEntrada = datos.hora_entrada !== undefined ? datos.hora_entrada : registro.hora_entrada;
  const horaSalida = datos.hora_salida !== undefined ? datos.hora_salida : registro.hora_salida;

  if (!horaEntrada) {
    throw new ServiceError(400, 'Debe indicar la hora de entrada si el registro no es una ausencia');
  }

  const horasTrabajadas = horaSalida ? calcularHoras(horaEntrada, horaSalida) : null;

  return asistenciaModel.actualizar(id, {
    hora_entrada: horaEntrada,
    hora_salida: horaSalida,
    horas_trabajadas: horasTrabajadas,
    ausente: false,
    justificacion,
  });
}

/**
 * Resumen de asistencia de un empleado en un período completo "YYYY-MM": días
 * trabajados, días de ausencia, horas totales y sobrejornada (sumada por bloques
 * semanales — RF-07 — en vez de sobre el mes completo).
 */
async function calcularResumenMensualEmpleado(empleadoId, periodo) {
  const { desde, hasta } = rangoDelPeriodo(periodo);
  const registros = await asistenciaModel.findAll({ empleadoId, desde, hasta });

  const diasTrabajados = registros.filter((r) => !r.ausente && r.horas_trabajadas != null).length;
  const diasAusentes = registros.filter((r) => r.ausente).length;
  const totalHoras = registros.reduce((acc, r) => acc + Number(r.horas_trabajadas || 0), 0);

  let horasSobrejornada = 0;
  for (const bloque of obtenerBloquesSemanalesDelPeriodo(periodo)) {
    const registrosBloque = await asistenciaModel.findAll({
      empleadoId,
      desde: bloque.desde,
      hasta: bloque.hasta,
    });
    const horasPorDia = registrosBloque.map((r) => r.horas_trabajadas);
    horasSobrejornada += calcularSobrejornadaSemanal(horasPorDia).horasSobrejornada;
  }

  return {
    diasTrabajados,
    diasAusentes,
    totalHoras: Math.round(totalHoras * 100) / 100,
    horasSobrejornada: Math.round(horasSobrejornada * 100) / 100,
  };
}

/**
 * RF-12: reporte mensual de asistencia. Con `empleadoId` devuelve el detalle de ese
 * empleado (registros + resumen); sin `empleadoId` devuelve el consolidado de todos
 * los empleados activos para el período.
 */
async function obtenerReporteMensual({ empleadoId, periodo }) {
  if (!esPeriodoValido(periodo)) {
    throw new ServiceError(400, 'El parámetro "periodo" es obligatorio, formato "YYYY-MM"');
  }

  if (empleadoId) {
    const empleado = await asegurarEmpleadoExiste(empleadoId);
    const { desde, hasta } = rangoDelPeriodo(periodo);
    const [registros, resumen] = await Promise.all([
      asistenciaModel.findAll({ empleadoId, desde, hasta }),
      calcularResumenMensualEmpleado(empleadoId, periodo),
    ]);
    return {
      periodo,
      empleado: { id: empleado.id, nombre: empleado.nombre, apellido: empleado.apellido, rut: empleado.rut },
      ...resumen,
      registros,
    };
  }

  const empleados = await empleadoModel.findAll();
  const filas = [];
  for (const empleado of empleados) {
    const resumen = await calcularResumenMensualEmpleado(empleado.id, periodo);
    filas.push({
      empleado_id: empleado.id,
      nombre: empleado.nombre,
      apellido: empleado.apellido,
      rut: empleado.rut,
      ...resumen,
    });
  }
  return { periodo, empleados: filas };
}

module.exports = {
  ServiceError,
  listarAsistencia,
  obtenerAsistencia,
  registrarEntrada,
  registrarSalida,
  registrarAusencia,
  obtenerResumenSemanal,
  actualizarAsistencia,
  obtenerReporteMensual,
};
