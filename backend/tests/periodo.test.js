const {
  esPeriodoValido,
  rangoDelPeriodo,
  obtenerBloquesSemanalesDelPeriodo,
} = require('../src/utils/periodo');

describe('esPeriodoValido', () => {
  it('acepta el formato YYYY-MM', () => {
    expect(esPeriodoValido('2026-09')).toBe(true);
    expect(esPeriodoValido('2026-01')).toBe(true);
    expect(esPeriodoValido('2026-12')).toBe(true);
  });

  it('rechaza formatos inválidos', () => {
    expect(esPeriodoValido('2026-9')).toBe(false);
    expect(esPeriodoValido('2026-13')).toBe(false);
    expect(esPeriodoValido('2026-00')).toBe(false);
    expect(esPeriodoValido('09-2026')).toBe(false);
    expect(esPeriodoValido('')).toBe(false);
    expect(esPeriodoValido(undefined)).toBe(false);
  });
});

describe('rangoDelPeriodo', () => {
  it('devuelve el primer y último día de septiembre 2026', () => {
    expect(rangoDelPeriodo('2026-09')).toEqual({ desde: '2026-09-01', hasta: '2026-09-30' });
  });

  it('devuelve el primer y último día de febrero 2026 (no bisiesto)', () => {
    expect(rangoDelPeriodo('2026-02')).toEqual({ desde: '2026-02-01', hasta: '2026-02-28' });
  });
});

describe('obtenerBloquesSemanalesDelPeriodo', () => {
  it('divide septiembre 2026 (30 días) en 5 bloques de hasta 7 días', () => {
    const bloques = obtenerBloquesSemanalesDelPeriodo('2026-09');
    expect(bloques).toEqual([
      { desde: '2026-09-01', hasta: '2026-09-07' },
      { desde: '2026-09-08', hasta: '2026-09-14' },
      { desde: '2026-09-15', hasta: '2026-09-21' },
      { desde: '2026-09-22', hasta: '2026-09-28' },
      { desde: '2026-09-29', hasta: '2026-09-30' },
    ]);
  });

  it('divide febrero 2026 (28 días, no bisiesto) en 4 bloques exactos', () => {
    const bloques = obtenerBloquesSemanalesDelPeriodo('2026-02');
    expect(bloques).toHaveLength(4);
    expect(bloques[3]).toEqual({ desde: '2026-02-22', hasta: '2026-02-28' });
  });
});
