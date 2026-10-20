const { calcularDigitoVerificador } = require('../../src/utils/rut');

// Genera RUTs en el rango 90.000.000-99.999.999: fuera del rango que SII asigna
// hoy a personas naturales, para que un dato de prueba nunca coincida con un RUT
// real que el usuario haya ingresado en la base de datos compartida de desarrollo.
// Además se eligen al azar en cada corrida para no repetir el mismo valor entre
// archivos de test ni entre corridas sucesivas.
function generarRutDePrueba() {
  const cuerpo = String(90000000 + Math.floor(Math.random() * 9999999));
  return `${cuerpo}-${calcularDigitoVerificador(cuerpo)}`;
}

module.exports = { generarRutDePrueba };
