/**
 * Lee una variable de entorno numérica. A diferencia de `Number(x) || default`,
 * respeta un valor configurado explícitamente en 0 (no lo trata como "no definido").
 */
function envNumber(nombre, porDefecto) {
  const valor = process.env[nombre];
  if (valor === undefined || valor === '') return porDefecto;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : porDefecto;
}

module.exports = { envNumber };
