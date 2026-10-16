const {
  calcularGratificacion,
  calcularDescuentoAfp,
  calcularDescuentoSalud,
  calcularDescuentoCesantia,
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
