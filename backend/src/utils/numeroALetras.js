/**
 * Convierte un monto entero (CLP, sin decimales) a su escritura en palabras, en
 * mayúsculas y terminado en "PESOS" — para la línea "SON:" de la liquidación de
 * sueldo (RF-10), igual que en un comprobante de remuneraciones real.
 */

const UNIDADES = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
const DIECIS = [
  'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE',
  'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE',
];
const VEINTIS = [
  'VEINTIUNO', 'VEINTIDOS', 'VEINTITRES', 'VEINTICUATRO', 'VEINTICINCO',
  'VEINTISEIS', 'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE',
];
const DECENAS = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
const CENTENAS = [
  '', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS',
  'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS',
];

/** "UNO" -> "UN" al final de la frase (apócope), igual antes de MIL/MILLONES que de PESOS. */
function conApocope(texto) {
  return texto.replace(/UNO$/, 'UN');
}

/** Convierte un número de 0 a 999. */
function convertirGrupo(n) {
  if (n === 0) return '';
  if (n === 100) return 'CIEN';

  const partes = [];
  const centena = Math.floor(n / 100);
  const resto = n % 100;

  if (centena > 0) partes.push(CENTENAS[centena]);

  if (resto > 0) {
    if (resto < 10) {
      partes.push(UNIDADES[resto]);
    } else if (resto < 20) {
      partes.push(DIECIS[resto - 10]);
    } else {
      const decena = Math.floor(resto / 10);
      const unidad = resto % 10;
      if (decena === 2 && unidad > 0) {
        partes.push(VEINTIS[unidad - 1]);
      } else if (unidad === 0) {
        partes.push(DECENAS[decena]);
      } else {
        partes.push(`${DECENAS[decena]} Y ${UNIDADES[unidad]}`);
      }
    }
  }

  return partes.join(' ');
}

function convertirEntero(n) {
  if (n === 0) return 'CERO';

  const millones = Math.floor(n / 1000000);
  const miles = Math.floor((n % 1000000) / 1000);
  const resto = n % 1000;

  const partes = [];
  if (millones > 0) {
    partes.push(millones === 1 ? 'UN MILLON' : `${conApocope(convertirGrupo(millones))} MILLONES`);
  }
  if (miles > 0) {
    partes.push(miles === 1 ? 'MIL' : `${conApocope(convertirGrupo(miles))} MIL`);
  }
  if (resto > 0) {
    partes.push(convertirGrupo(resto));
  }

  return partes.join(' ');
}

function convertirMontoATexto(monto) {
  const entero = Math.round(Math.abs(Number(monto)));
  const texto = conApocope(convertirEntero(entero));
  const sufijo = entero === 1 ? 'PESO' : 'PESOS';
  return `${texto} ${sufijo}`;
}

module.exports = { convertirMontoATexto };
