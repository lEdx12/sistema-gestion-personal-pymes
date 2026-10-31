/**
 * Impuesto Único de Segunda Categoría: tabla progresiva por tramos expresados en UTM
 * (igual que la tabla oficial del SII — ver migrations/004_tramos_impuesto_unico.sql).
 * Recibe la base tributable en pesos (haberes imponibles menos las cotizaciones de AFP
 * y salud, que son deducibles) y la convierte a UTM para ubicar el tramo.
 */
function calcularImpuestoUnico(baseTributablePesos, tramos, valorUtm) {
  if (!tramos || tramos.length === 0 || !valorUtm || baseTributablePesos <= 0) return 0;

  const baseUtm = baseTributablePesos / valorUtm;
  const tramo =
    tramos.find((t) => {
      const hasta = t.hasta_utm === null || t.hasta_utm === undefined ? Infinity : Number(t.hasta_utm);
      return baseUtm >= Number(t.desde_utm) && baseUtm < hasta;
    }) || tramos[tramos.length - 1];

  const impuestoUtm = baseUtm * Number(tramo.factor) - Number(tramo.rebaja_utm);
  return Math.max(0, Math.round(impuestoUtm * valorUtm));
}

module.exports = { calcularImpuestoUnico };
