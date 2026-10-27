const { slugificar } = require('../src/utils/slug');

describe('slugificar', () => {
  it('quita tildes y la ñ', () => {
    expect(slugificar('María José Muñoz')).toBe('maria-jose-munoz');
  });

  it('colapsa espacios y símbolos en un solo guion', () => {
    expect(slugificar('  Juan   Pérez--Soto  ')).toBe('juan-perez-soto');
  });

  it('devuelve vacío para valores vacíos', () => {
    expect(slugificar('')).toBe('');
    expect(slugificar(null)).toBe('');
    expect(slugificar(undefined)).toBe('');
  });
});
