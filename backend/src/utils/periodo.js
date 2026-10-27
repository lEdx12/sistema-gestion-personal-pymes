const FORMATO_PERIODO = /^\d{4}-(0[1-9]|1[0-2])$/;

function esPeriodoValido(periodo) {
  return typeof periodo === 'string' && FORMATO_PERIODO.test(periodo);
}

/** Rango de fechas (primer y último día del mes) de un período "YYYY-MM". */
function rangoDelPeriodo(periodo) {
  const [anioStr, mesStr] = periodo.split('-');
  const anio = Number(anioStr);
  const mes = Number(mesStr);
  const ultimoDia = new Date(anio, mes, 0).getDate();
  return {
    desde: `${anioStr}-${mesStr}-01`,
    hasta: formatearFecha(anio, mes, ultimoDia),
  };
}

/**
 * Divide un período "YYYY-MM" en bloques de 7 días (desde el día 1). Se usa para
 * aplicar el tope de jornada semanal (RF-07) dentro de cada bloque en vez de sobre el
 * mes completo. Simplificación: los bloques son de calendario (no se alinean a semanas
 * ISO) y el último bloque del mes no se combina con el mes siguiente.
 */
function obtenerBloquesSemanalesDelPeriodo(periodo) {
  const [anioStr, mesStr] = periodo.split('-');
  const anio = Number(anioStr);
  const mes = Number(mesStr);
  const ultimoDia = new Date(anio, mes, 0).getDate();

  const bloques = [];
  for (let dia = 1; dia <= ultimoDia; dia += 7) {
    const finDia = Math.min(dia + 6, ultimoDia);
    bloques.push({
      desde: formatearFecha(anio, mes, dia),
      hasta: formatearFecha(anio, mes, finDia),
    });
  }
  return bloques;
}

function formatearFecha(anio, mes, dia) {
  return `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

/** Cantidad de días del mes de un período "YYYY-MM" (28-31). */
function diasDelPeriodo(periodo) {
  const [anioStr, mesStr] = periodo.split('-');
  return new Date(Number(anioStr), Number(mesStr), 0).getDate();
}

module.exports = {
  esPeriodoValido,
  rangoDelPeriodo,
  obtenerBloquesSemanalesDelPeriodo,
  diasDelPeriodo,
};
