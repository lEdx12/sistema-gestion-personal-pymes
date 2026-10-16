const { envNumber } = require('../src/utils/env');

describe('envNumber', () => {
  const clave = 'ENV_TEST_VALOR';

  afterEach(() => {
    delete process.env[clave];
  });

  it('usa el valor por defecto si la variable no está definida', () => {
    expect(envNumber(clave, 45)).toBe(45);
  });

  it('respeta un valor configurado en 0 (no lo trata como no definido)', () => {
    process.env[clave] = '0';
    expect(envNumber(clave, 45)).toBe(0);
  });

  it('parsea un valor numérico configurado', () => {
    process.env[clave] = '0.5';
    expect(envNumber(clave, 45)).toBe(0.5);
  });

  it('usa el valor por defecto si la variable no es un número válido', () => {
    process.env[clave] = 'no-es-un-numero';
    expect(envNumber(clave, 45)).toBe(45);
  });
});
