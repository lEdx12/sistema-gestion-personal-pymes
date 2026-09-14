/**
 * Utilidades de manejo de horas (formato "HH:MM" o "HH:MM:SS").
 * Base reutilizada por RF-07 (cálculo de horas trabajadas) y RF-08 (horas extra).
 */

function horaAMinutos(hora) {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

function esHoraPosterior(horaA, horaB) {
  return horaAMinutos(horaB) > horaAMinutos(horaA);
}

module.exports = { horaAMinutos, esHoraPosterior };
