const {
  calcularValorHoraOrdinaria,
  calcularMontoHorasExtra,
  calcularHorasExtra,
} = require('../src/services/horasExtra.service');

describe('calcularValorHoraOrdinaria', () => {
  it('divide el sueldo base por las horas mensuales de jornada', () => {
    expect(calcularValorHoraOrdinaria(900000, 180)).toBe(5000);
  });

  it('lanza error si el sueldo base no es positivo', () => {
    expect(() => calcularValorHoraOrdinaria(0, 180)).toThrow();
    expect(() => calcularValorHoraOrdinaria(-100, 180)).toThrow();
  });
});

describe('calcularMontoHorasExtra', () => {
  it('aplica el recargo del 50% por defecto (Art. 32)', () => {
    expect(calcularMontoHorasExtra(5, 5000)).toBe(37500);
  });

  it('permite un recargo configurable', () => {
    expect(calcularMontoHorasExtra(5, 5000, 0.25)).toBe(31250);
  });

  it('lanza error si las horas extra son negativas', () => {
    expect(() => calcularMontoHorasExtra(-1, 5000)).toThrow();
  });

  it('no paga nada si no hay horas extra', () => {
    expect(calcularMontoHorasExtra(0, 5000)).toBe(0);
  });
});

describe('calcularHorasExtra', () => {
  it('CP-05: 5 horas extra sobre sueldo base 900.000 -> recargo 50%', () => {
    const resultado = calcularHorasExtra({
      sueldoBase: 900000,
      horasSobrejornada: 5,
      horasMensuales: 180,
    });
    expect(resultado.valorHoraOrdinaria).toBe(5000);
    expect(resultado.montoHorasExtra).toBe(37500);
  });
});
