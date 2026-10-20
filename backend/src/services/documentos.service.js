const documentoModel = require('../models/documento.model');
const empleadoModel = require('../models/empleado.model');
const almacenamiento = require('./almacenamiento.service');

class ServiceError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function obtenerEmpleadoOFallar(empleadoId) {
  if (!empleadoId) {
    throw new ServiceError(400, 'El campo "empleado_id" es obligatorio');
  }
  const empleado = await empleadoModel.findById(empleadoId);
  if (!empleado) throw new ServiceError(404, 'Empleado no encontrado');
  return empleado;
}

async function listarDocumentos(empleadoId) {
  await obtenerEmpleadoOFallar(empleadoId);
  return documentoModel.findAllByEmpleado(empleadoId);
}

async function subirDocumento(empleadoId, archivo, { tipo } = {}) {
  await obtenerEmpleadoOFallar(empleadoId);
  if (!archivo) throw new ServiceError(400, 'Debe adjuntar un archivo');

  const url = await almacenamiento.subirArchivo(archivo.buffer, archivo.originalname);
  return documentoModel.create({
    empleado_id: empleadoId,
    nombre: archivo.originalname,
    tipo: tipo || archivo.mimetype,
    url,
  });
}

async function eliminarDocumento(id) {
  const documento = await documentoModel.findById(id);
  if (!documento) throw new ServiceError(404, 'Documento no encontrado');
  await almacenamiento.eliminarArchivoPorUrl(documento.url);
  await documentoModel.eliminar(id);
}

module.exports = { ServiceError, listarDocumentos, subirDocumento, eliminarDocumento };
