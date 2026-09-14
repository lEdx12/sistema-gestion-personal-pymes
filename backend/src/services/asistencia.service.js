const asistenciaModel = require('../models/asistencia.model');
const empleadoModel = require('../models/empleado.model');
const { esHoraPosterior } = require('../utils/horas');
const {
  calcularHorasTrabajadas,
  calcularSobrejornadaSemanal,
} = require('./horasTrabajadas.service');

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
  if (!esHoraPosterior(registro.hora_entrada, hora_salida)) {
    throw new ServiceError(400, 'La hora de salida debe ser posterior a la hora de entrada');
  }

  const horasTrabajadas = calcularHorasTrabajadas(registro.hora_entrada, hora_salida);
  return asistenciaModel.marcarSalida(id, hora_salida, horasTrabajadas);
}

/** Suma las horas trabajadas de un empleado en un rango de fechas y detecta sobrejornada. */
async function obtenerResumenSemanal({ empleadoId, desde, hasta }) {
  if (!empleadoId || !desde || !hasta) {
    throw new ServiceError(400, 'Los parámetros "empleado_id", "desde" y "hasta" son obligatorios');
  }
  await asegurarEmpleadoExiste(empleadoId);

  const registros = await asistenciaModel.findAll({ empleadoId, desde, hasta });
  const horasPorDia = registros.map((r) => r.horas_trabajadas);
  return calcularSobrejornadaSemanal(horasPorDia);
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

module.exports = {
  ServiceError,
  listarAsistencia,
  obtenerAsistencia,
  registrarEntrada,
  registrarSalida,
  registrarAusencia,
  obtenerResumenSemanal,
};
