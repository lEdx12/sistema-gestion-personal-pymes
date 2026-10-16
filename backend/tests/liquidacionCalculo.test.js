const {
  calcularGratificacion,
  calcularDescuentoAfp,
  calcularDescuentoSalud,
  calcularDescuentoCesantia,
  obtenerBloquesSemanalesDelPeriodo,
} = require('../src/services/liquidacionCalculo.service');

describe('calcularGratificacion', () => {
  it('CP-06: 25% de la base imponible cuando no supera el tope', () => {
    expect(calcularGratificacion(500000)).toBe(125000);
  });

  it('respeta el tope mensual cuando el 25% lo supera', () => {
    expect(calcularGratificacion(2000000, 0.25, 240000)).toBe(240000);
  });
});

describe('calcularDescuentoAfp', () => {
  it('CP-06: 10% de los haberes', () => {
    expect(calcularDescuentoAfp(625000)).toBe(62500);
  });
});

describe('calcularDescuentoSalud', () => {
  it('CP-06: 7% de los haberes', () => {
    expect(calcularDescuentoSalud(625000)).toBe(43750);
  });
});

describe('calcularDescuentoCesantia', () => {
  it('aplica la tasa del trabajador para contrato indefinido (0.6%)', () => {
    expect(calcularDescuentoCesantia(625000, 'indefinido')).toBe(3750);
  });

  it('no descuenta cesantía al trabajador en contrato a plazo fijo', () => {
    expect(calcularDescuentoCesantia(625000, 'plazo_fijo')).toBe(0);
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
