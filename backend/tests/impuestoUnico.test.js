const { calcularImpuestoUnico } = require('../src/utils/impuestoUnico');

const VALOR_UTM = 68000;

// Tabla real de tramos (ver migrations/004_tramos_impuesto_unico.sql).
const TRAMOS = [
  { orden: 1, desde_utm: 0, hasta_utm: 13.5, factor: 0, rebaja_utm: 0 },
  { orden: 2, desde_utm: 13.5, hasta_utm: 30, factor: 0.04, rebaja_utm: 0.54 },
  { orden: 3, desde_utm: 30, hasta_utm: 50, factor: 0.08, rebaja_utm: 1.74 },
  { orden: 4, desde_utm: 50, hasta_utm: 70, factor: 0.135, rebaja_utm: 4.49 },
  { orden: 5, desde_utm: 70, hasta_utm: 90, factor: 0.23, rebaja_utm: 11.14 },
  { orden: 6, desde_utm: 90, hasta_utm: 120, factor: 0.304, rebaja_utm: 17.8 },
  { orden: 7, desde_utm: 120, hasta_utm: 310, factor: 0.355, rebaja_utm: 23.92 },
  { orden: 8, desde_utm: 310, hasta_utm: null, factor: 0.4, rebaja_utm: 37.57 },
];

describe('calcularImpuestoUnico', () => {
  it('devuelve 0 para una base dentro del tramo exento (hasta 13.5 UTM)', () => {
    const base = 10 * VALOR_UTM; // 10 UTM, dentro del tramo exento
    expect(calcularImpuestoUnico(base, TRAMOS, VALOR_UTM)).toBe(0);
  });

  it('calcula el impuesto en el segundo tramo (factor 4%, rebaja 0.54 UTM)', () => {
    const base = 20 * VALOR_UTM; // 20 UTM
    const esperado = Math.round((20 * 0.04 - 0.54) * VALOR_UTM);
    expect(calcularImpuestoUnico(base, TRAMOS, VALOR_UTM)).toBe(esperado);
  });

  it('calcula el impuesto en el último tramo (sin tope superior)', () => {
    const base = 400 * VALOR_UTM; // 400 UTM, por sobre los 310 del último tramo
    const esperado = Math.round((400 * 0.4 - 37.57) * VALOR_UTM);
    expect(calcularImpuestoUnico(base, TRAMOS, VALOR_UTM)).toBe(esperado);
  });

  it('nunca devuelve un monto negativo', () => {
    // Caso límite: justo en el borde de un tramo, donde factor*base - rebaja podría dar
    // un valor muy pequeño o negativo por redondeo.
    const base = 13.5 * VALOR_UTM;
    expect(calcularImpuestoUnico(base, TRAMOS, VALOR_UTM)).toBeGreaterThanOrEqual(0);
  });

  it('devuelve 0 si la base tributable es 0 o negativa', () => {
    expect(calcularImpuestoUnico(0, TRAMOS, VALOR_UTM)).toBe(0);
    expect(calcularImpuestoUnico(-1000, TRAMOS, VALOR_UTM)).toBe(0);
  });

  it('devuelve 0 si no hay tramos o no hay valor de UTM configurado', () => {
    expect(calcularImpuestoUnico(100000000, [], VALOR_UTM)).toBe(0);
    expect(calcularImpuestoUnico(100000000, TRAMOS, 0)).toBe(0);
  });
});
