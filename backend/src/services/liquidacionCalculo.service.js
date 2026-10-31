const { envNumber } = require('../utils/env');

// TODO: validar valores legales vigentes (Código del Trabajo / Dirección del Trabajo).
// Todos estos porcentajes/topes son promedios de referencia, no datos por AFP/Isapre
// específicos de cada empleado — ver nota en backend/README.md (RF-09).
const DESCUENTO_AFP_PORCENTAJE = envNumber('DESCUENTO_AFP_PORCENTAJE', 0.1);
const DESCUENTO_SALUD_PORCENTAJE = envNumber('DESCUENTO_SALUD_PORCENTAJE', 0.07);
const AFC_TRABAJADOR_INDEFINIDO_PORCENTAJE = envNumber('AFC_TRABAJADOR_INDEFINIDO_PORCENTAJE', 0.006);
const AFC_TRABAJADOR_PLAZO_FIJO_PORCENTAJE = envNumber('AFC_TRABAJADOR_PLAZO_FIJO_PORCENTAJE', 0);
const GRATIFICACION_PORCENTAJE = envNumber('GRATIFICACION_PORCENTAJE', 0.25);
const GRATIFICACION_TOPE_MENSUAL = envNumber('GRATIFICACION_TOPE_MENSUAL', 240000);

/**
 * Gratificación legal (Art. 47): 25% de lo devengado en el mes (sueldo base + horas
 * extra), con un tope mensual configurable.
 */
function calcularGratificacion(baseImponible, porcentaje = GRATIFICACION_PORCENTAJE, tope = GRATIFICACION_TOPE_MENSUAL) {
  return Math.min(Math.round(baseImponible * porcentaje), tope);
}

function calcularDescuentoAfp(totalHaberes, porcentaje = DESCUENTO_AFP_PORCENTAJE) {
  return Math.round(totalHaberes * porcentaje);
}

function calcularDescuentoSalud(totalHaberes, porcentaje = DESCUENTO_SALUD_PORCENTAJE) {
  return Math.round(totalHaberes * porcentaje);
}

/**
 * Seguro de cesantía (AFC): el aporte del trabajador depende del tipo de contrato —
 * en un contrato a plazo fijo el trabajador no cotiza (solo el empleador).
 */
function calcularDescuentoCesantia(
  totalHaberes,
  tipoContrato,
  porcentajeIndefinido = AFC_TRABAJADOR_INDEFINIDO_PORCENTAJE,
  porcentajePlazoFijo = AFC_TRABAJADOR_PLAZO_FIJO_PORCENTAJE,
) {
  const porcentaje = tipoContrato === 'plazo_fijo' ? porcentajePlazoFijo : porcentajeIndefinido;
  return Math.round(totalHaberes * porcentaje);
}

module.exports = {
  calcularGratificacion,
  calcularDescuentoAfp,
  calcularDescuentoSalud,
  calcularDescuentoCesantia,
  DESCUENTO_AFP_PORCENTAJE,
  DESCUENTO_SALUD_PORCENTAJE,
  AFC_TRABAJADOR_INDEFINIDO_PORCENTAJE,
  AFC_TRABAJADOR_PLAZO_FIJO_PORCENTAJE,
  GRATIFICACION_PORCENTAJE,
  GRATIFICACION_TOPE_MENSUAL,
};
