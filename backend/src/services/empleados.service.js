const empleadoModel = require('../models/empleado.model');
const { validarRut, normalizarRut } = require('../utils/rut');

class ServiceError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const CAMPOS_OBLIGATORIOS = ['rut', 'nombre', 'apellido', 'fecha_ingreso', 'sueldo_base'];

/** Valida presencia de campos obligatorios y formato de RUT. Lanza ServiceError si falla. */
function validarDatosEmpleado(datos) {
  for (const campo of CAMPOS_OBLIGATORIOS) {
    if (datos[campo] === undefined || datos[campo] === null || datos[campo] === '') {
      throw new ServiceError(400, `El campo "${campo}" es obligatorio`);
    }
  }

  if (!validarRut(datos.rut)) {
    throw new ServiceError(400, 'El RUT ingresado no es válido');
  }

  if (Number.isNaN(Number(datos.sueldo_base)) || Number(datos.sueldo_base) <= 0) {
    throw new ServiceError(400, 'El sueldo base debe ser un número positivo');
  }
}

async function listarEmpleados(opciones) {
  return empleadoModel.findAll(opciones);
}

async function listarResumenEmpleados() {
  return empleadoModel.findAllResumen();
}

async function obtenerEmpleado(id) {
  const empleado = await empleadoModel.findById(id);
  if (!empleado) throw new ServiceError(404, 'Empleado no encontrado');
  return empleado;
}

async function crearEmpleado(datos) {
  validarDatosEmpleado(datos);
  const rutNormalizado = normalizarRut(datos.rut);

  const existente = await empleadoModel.findByRut(rutNormalizado);
  if (existente) {
    throw new ServiceError(409, 'Empleado ya registrado');
  }

  return empleadoModel.create({ ...datos, rut: rutNormalizado });
}

async function actualizarEmpleado(id, datos) {
  await obtenerEmpleado(id);

  const datosConRut = { ...datos, rut: undefined };
  const CAMPOS_SIN_RUT = CAMPOS_OBLIGATORIOS.filter((c) => c !== 'rut');
  for (const campo of CAMPOS_SIN_RUT) {
    if (datosConRut[campo] === undefined || datosConRut[campo] === null || datosConRut[campo] === '') {
      throw new ServiceError(400, `El campo "${campo}" es obligatorio`);
    }
  }
  if (Number.isNaN(Number(datos.sueldo_base)) || Number(datos.sueldo_base) <= 0) {
    throw new ServiceError(400, 'El sueldo base debe ser un número positivo');
  }

  const actualizado = await empleadoModel.update(id, datos);
  return actualizado;
}

async function desactivarEmpleado(id) {
  await obtenerEmpleado(id);
  return empleadoModel.desactivar(id);
}

async function reactivarEmpleado(id) {
  await obtenerEmpleado(id);
  return empleadoModel.reactivar(id);
}

module.exports = {
  ServiceError,
  listarEmpleados,
  listarResumenEmpleados,
  obtenerEmpleado,
  crearEmpleado,
  actualizarEmpleado,
  desactivarEmpleado,
  reactivarEmpleado,
};
