const { horaAMinutos } = require('../utils/horas');

// TODO: validar valor legal vigente (Código del Trabajo, jornada ordinaria semanal)
const JORNADA_SEMANAL_MAX_HORAS = Number(process.env.JORNADA_SEMANAL_MAX_HORAS) || 45;

/**
 * Calcula las horas trabajadas a partir de la hora de entrada y salida. Soporta turnos
 * nocturnos que cruzan la medianoche: si la salida es numéricamente anterior a la
 * entrada, se asume que ocurrió al día siguiente (se le suman 24 horas).
 */
function calcularHorasTrabajadas(horaEntrada, horaSalida) {
  let minutos = horaAMinutos(horaSalida) - horaAMinutos(horaEntrada);
  if (minutos === 0) {
    throw new Error('La hora de salida no puede ser igual a la hora de entrada');
  }
  if (minutos < 0) {
    minutos += 24 * 60;
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
