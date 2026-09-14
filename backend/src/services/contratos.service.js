const pool = require('../config/db');
const contratoModel = require('../models/contrato.model');
const empleadoModel = require('../models/empleado.model');

class ServiceError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const TIPOS_VALIDOS = ['indefinido', 'plazo_fijo'];

/** Valida los datos de un contrato según su tipo. Lanza ServiceError si falla. */
function validarDatosContrato({ tipo, fecha_inicio, fecha_termino }) {
  if (!tipo || !fecha_inicio) {
    throw new ServiceError(400, 'Los campos "tipo" y "fecha_inicio" son obligatorios');
  }
  if (!TIPOS_VALIDOS.includes(tipo)) {
    throw new ServiceError(400, `El tipo de contrato debe ser uno de: ${TIPOS_VALIDOS.join(', ')}`);
  }
  if (tipo === 'plazo_fijo') {
    if (!fecha_termino) {
      throw new ServiceError(400, 'Un contrato a plazo fijo requiere "fecha_termino"');
    }
    if (new Date(fecha_termino) <= new Date(fecha_inicio)) {
      throw new ServiceError(400, 'La fecha de término debe ser posterior a la fecha de inicio');
    }
  }
}

async function asegurarEmpleadoExiste(empleadoId) {
  const empleado = await empleadoModel.findById(empleadoId);
  if (!empleado) throw new ServiceError(404, 'Empleado no encontrado');
  return empleado;
}

async function listarContratos(opciones) {
  return contratoModel.findAll(opciones);
}

async function obtenerContrato(id) {
  const contrato = await contratoModel.findById(id);
  if (!contrato) throw new ServiceError(404, 'Contrato no encontrado');
  return contrato;
}

async function crearContrato(datos) {
  validarDatosContrato(datos);
  await asegurarEmpleadoExiste(datos.empleado_id);

  const activo = await contratoModel.findActivoByEmpleado(datos.empleado_id);
  if (activo) {
    throw new ServiceError(
      409,
      'El empleado ya tiene un contrato activo. Use el endpoint de renovación para reemplazarlo.',
    );
  }

  return contratoModel.create(datos);
}

async function actualizarContrato(id, datos) {
  await obtenerContrato(id);
  validarDatosContrato(datos);
  return contratoModel.update(id, datos);
}

/** Cierra el contrato activo del empleado (fecha_termino = hoy, salvo que se indique otra) y crea uno nuevo. */
async function renovarContrato(contratoActualId, datosNuevoContrato) {
  const contratoActual = await obtenerContrato(contratoActualId);
  if (!contratoActual.activo) {
    throw new ServiceError(400, 'El contrato indicado ya no está activo');
  }

  const datosNuevo = { ...datosNuevoContrato, empleado_id: contratoActual.empleado_id };
  validarDatosContrato(datosNuevo);

  const fechaCierre = datosNuevoContrato.fecha_inicio;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await contratoModel.cerrar(contratoActualId, fechaCierre, client);
    const nuevo = await contratoModel.create(datosNuevo, client);
    await client.query('COMMIT');
    return nuevo;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  ServiceError,
  listarContratos,
  obtenerContrato,
  crearContrato,
  actualizarContrato,
  renovarContrato,
};
