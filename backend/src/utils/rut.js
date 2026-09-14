/**
 * Utilidades de validación y formateo de RUT chileno.
 */

function limpiarRut(rut) {
  if (!rut) return '';
  return rut.replace(/[.\s]/g, '').toUpperCase();
}

function calcularDigitoVerificador(rutSinDv) {
  let suma = 0;
  let multiplicador = 2;

  for (let i = rutSinDv.length - 1; i >= 0; i--) {
    suma += parseInt(rutSinDv[i], 10) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const resto = 11 - (suma % 11);
  if (resto === 11) return '0';
  if (resto === 10) return 'K';
  return String(resto);
}

function validarRut(rutCompleto) {
  const limpio = limpiarRut(rutCompleto);
  if (!/^\d{7,8}-[0-9K]$/.test(limpio)) return false;

  const [cuerpo, dv] = limpio.split('-');
  return calcularDigitoVerificador(cuerpo) === dv;
}

function normalizarRut(rutCompleto) {
  return limpiarRut(rutCompleto);
}

module.exports = { validarRut, normalizarRut, calcularDigitoVerificador, limpiarRut };
