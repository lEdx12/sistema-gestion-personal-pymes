const configuracionModel = require('../models/configuracion.model');
const tramoModel = require('../models/tramoImpuesto.model');

class ServiceError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const CAMPOS_PORCENTAJE = [
  'afp_porcentaje',
  'salud_porcentaje',
  'afc_indefinido_porcentaje',
  'afc_plazo_fijo_porcentaje',
  'gratificacion_porcentaje',
];
const CAMPOS_MONTO = ['gratificacion_tope_mensual', 'movilizacion_monto', 'colacion_monto', 'valor_utm'];

function validarPorcentaje(valor, campo) {
  const numero = Number(valor);
  if (valor === undefined || valor === null || valor === '' || Number.isNaN(numero) || numero < 0 || numero > 1) {
    throw new ServiceError(400, `El campo "${campo}" debe ser un porcentaje entre 0 y 1 (ej. 0.1 = 10%)`);
  }
}

function validarMonto(valor, campo) {
  const numero = Number(valor);
  if (valor === undefined || valor === null || valor === '' || Number.isNaN(numero) || numero < 0) {
    throw new ServiceError(400, `El campo "${campo}" debe ser un monto positivo`);
  }
}

function validarDatosConfiguracion(datos) {
  for (const campo of CAMPOS_PORCENTAJE) validarPorcentaje(datos[campo], campo);
  for (const campo of CAMPOS_MONTO) validarMonto(datos[campo], campo);
}

async function obtenerConfiguracion() {
  const config = await configuracionModel.obtener();
  if (!config) throw new ServiceError(500, 'No hay configuración de sueldo inicializada');
  return config;
}

async function actualizarConfiguracion(datos, actualizadoPor) {
  validarDatosConfiguracion(datos);
  return configuracionModel.actualizar(datos, actualizadoPor);
}

async function listarTramosImpuesto() {
  return tramoModel.findAll();
}

/**
 * Valida la tabla de tramos como un conjunto: ordenados consecutivamente desde 1,
 * el primero empieza en 0 UTM, cada uno continúa exactamente donde terminó el
 * anterior (sin huecos ni superposiciones) y solo el último puede quedar sin tope.
 */
function validarTramos(tramos) {
  if (!Array.isArray(tramos) || tramos.length === 0) {
    throw new ServiceError(400, 'Debe enviar al menos un tramo');
  }

  const ordenados = [...tramos].sort((a, b) => Number(a.orden) - Number(b.orden));

  ordenados.forEach((tramo, indice) => {
    const numeroTramo = indice + 1;
    if (Number(tramo.orden) !== numeroTramo) {
      throw new ServiceError(400, 'Los tramos deben estar numerados consecutivamente desde 1 (campo "orden")');
    }
    if (Number.isNaN(Number(tramo.desde_utm)) || Number(tramo.desde_utm) < 0) {
      throw new ServiceError(400, `Tramo ${numeroTramo}: "desde_utm" debe ser un número positivo`);
    }
    const esUltimo = indice === ordenados.length - 1;
    const sinTope = tramo.hasta_utm === null || tramo.hasta_utm === undefined || tramo.hasta_utm === '';
    if (!esUltimo && sinTope) {
      throw new ServiceError(400, `Tramo ${numeroTramo}: solo el último tramo puede quedar sin tope ("hasta_utm")`);
    }
    if (!sinTope && Number(tramo.hasta_utm) <= Number(tramo.desde_utm)) {
      throw new ServiceError(400, `Tramo ${numeroTramo}: "hasta_utm" debe ser mayor que "desde_utm"`);
    }
    if (Number.isNaN(Number(tramo.factor)) || Number(tramo.factor) < 0 || Number(tramo.factor) > 1) {
      throw new ServiceError(400, `Tramo ${numeroTramo}: "factor" debe ser un porcentaje entre 0 y 1`);
    }
    if (Number.isNaN(Number(tramo.rebaja_utm)) || Number(tramo.rebaja_utm) < 0) {
      throw new ServiceError(400, `Tramo ${numeroTramo}: "rebaja_utm" no puede ser negativo`);
    }
    if (indice > 0 && Number(tramo.desde_utm) !== Number(ordenados[indice - 1].hasta_utm)) {
      throw new ServiceError(
        400,
        `Tramo ${numeroTramo}: "desde_utm" (${tramo.desde_utm}) debe continuar exactamente donde terminó el tramo ${indice} (${ordenados[indice - 1].hasta_utm})`,
      );
    }
  });

  if (Number(ordenados[0].desde_utm) !== 0) {
    throw new ServiceError(400, 'El primer tramo debe comenzar en 0 UTM');
  }

  return ordenados;
}

async function actualizarTramosImpuesto(tramos) {
  const validados = validarTramos(tramos);
  return tramoModel.reemplazarTodos(validados);
}

module.exports = {
  ServiceError,
  obtenerConfiguracion,
  actualizarConfiguracion,
  listarTramosImpuesto,
  actualizarTramosImpuesto,
};
