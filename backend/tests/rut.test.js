const { validarRut, normalizarRut } = require('../src/utils/rut');

describe('validarRut', () => {
  it('acepta un RUT válido con puntos y guión', () => {
    expect(validarRut('12.345.678-5')).toBe(true);
  });

  it('acepta un RUT válido sin puntos', () => {
    expect(validarRut('12345678-5')).toBe(true);
  });

  it('acepta un RUT válido con dígito verificador K', () => {
    expect(validarRut('1.000.005-K')).toBe(true);
  });

  it('rechaza un RUT con dígito verificador incorrecto', () => {
    expect(validarRut('12.345.678-9')).toBe(false);
  });

  it('rechaza un RUT con formato inválido', () => {
    expect(validarRut('no-es-un-rut')).toBe(false);
  });
});

describe('normalizarRut', () => {
  it('quita puntos y espacios, mantiene el guión', () => {
    expect(normalizarRut('12.345.678-5')).toBe('12345678-5');
  });
});
