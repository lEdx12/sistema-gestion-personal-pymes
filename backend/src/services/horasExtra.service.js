const { envNumber } = require('../utils/env');

// TODO: validar valores legales vigentes (Art. 32 Código del Trabajo)
const RECARGO_HORA_EXTRA = envNumber('RECARGO_HORA_EXTRA', 0.5);
const HORAS_MENSUALES_JORNADA = envNumber('HORAS_MENSUALES_JORNADA', 180);

/** Valor de la hora ordinaria a partir del sueldo base mensual. */
function calcularValorHoraOrdinaria(sueldoBase, horasMensuales = HORAS_MENSUALES_JORNADA) {
  if (sueldoBase <= 0 || horasMensuales <= 0) {
    throw new Error('El sueldo base y las horas mensuales deben ser positivos');
  }
  return Math.round(sueldoBase / horasMensuales);
}

/**
 * Monto a pagar por horas extra: cada hora se paga al valor de la hora ordinaria más
 * el recargo mínimo del 50% (Art. 32 Código del Trabajo, configurable vía
 * RECARGO_HORA_EXTRA).
 */
function calcularMontoHorasExtra(horasExtra, valorHoraOrdinaria, recargo = RECARGO_HORA_EXTRA) {
  if (horasExtra < 0) {
    throw new Error('Las horas extra no pueden ser negativas');
  }
  return Math.round(horasExtra * valorHoraOrdinaria * (1 + recargo));
}

/** Calcula el valor hora y el monto de horas extra a partir del sueldo base y la sobrejornada. */
function calcularHorasExtra({ sueldoBase, horasSobrejornada, horasMensuales, recargo }) {
  const valorHoraOrdinaria = calcularValorHoraOrdinaria(sueldoBase, horasMensuales);
  const montoHorasExtra = calcularMontoHorasExtra(horasSobrejornada, valorHoraOrdinaria, recargo);
  return { valorHoraOrdinaria, montoHorasExtra };
}

module.exports = {
  calcularValorHoraOrdinaria,
  calcularMontoHorasExtra,
  calcularHorasExtra,
  RECARGO_HORA_EXTRA,
  HORAS_MENSUALES_JORNADA,
};
