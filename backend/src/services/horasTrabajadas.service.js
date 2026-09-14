const { horaAMinutos } = require('../utils/horas');

// TODO: validar valor legal vigente (Código del Trabajo, jornada ordinaria semanal)
const JORNADA_SEMANAL_MAX_HORAS = Number(process.env.JORNADA_SEMANAL_MAX_HORAS) || 45;

/** Calcula las horas trabajadas en un día a partir de la hora de entrada y salida. */
function calcularHorasTrabajadas(horaEntrada, horaSalida) {
  const minutos = horaAMinutos(horaSalida) - horaAMinutos(horaEntrada);
  if (minutos <= 0) {
    throw new Error('La hora de salida debe ser posterior a la hora de entrada');
  }
  return Math.round((minutos / 60) * 100) / 100;
}

/**
 * Suma las horas trabajadas de una semana y calcula el exceso sobre la jornada
 * ordinaria máxima (Art. 32 Código del Trabajo — 45h/semana por defecto, configurable
 * vía JORNADA_SEMANAL_MAX_HORAS).
 */
function calcularSobrejornadaSemanal(horasPorDia, jornadaMaxHoras = JORNADA_SEMANAL_MAX_HORAS) {
  const totalHoras = horasPorDia.reduce((acc, h) => acc + Number(h || 0), 0);
  const horasSobrejornada = Math.max(0, Math.round((totalHoras - jornadaMaxHoras) * 100) / 100);
  return {
    totalHoras: Math.round(totalHoras * 100) / 100,
    horasSobrejornada,
    jornadaMaxHoras,
  };
}

module.exports = {
  calcularHorasTrabajadas,
  calcularSobrejornadaSemanal,
  JORNADA_SEMANAL_MAX_HORAS,
};
