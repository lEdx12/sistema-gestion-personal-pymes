const { convertirMontoATexto } = require('../src/utils/numeroALetras');

describe('convertirMontoATexto', () => {
  it('convierte 856956 igual que un comprobante real (caso de referencia)', () => {
    expect(convertirMontoATexto(856956)).toBe(
      'OCHOCIENTOS CINCUENTA Y SEIS MIL NOVECIENTOS CINCUENTA Y SEIS PESOS',
    );
  });

  it('maneja el cero', () => {
    expect(convertirMontoATexto(0)).toBe('CERO PESOS');
  });

  it('usa el singular "PESO" para 1', () => {
    expect(convertirMontoATexto(1)).toBe('UN PESO');
  });

  it('aplica la apócope de "UNO" a "UN" antes de PESOS', () => {
    expect(convertirMontoATexto(21)).toBe('VEINTIUN PESOS');
  });

  it('aplica la apócope antes de MIL y de PESOS a la vez', () => {
    expect(convertirMontoATexto(21521)).toBe('VEINTIUN MIL QUINIENTOS VEINTIUN PESOS');
  });

  it('usa "CIEN" (no "CIENTO") para la centena exacta', () => {
    expect(convertirMontoATexto(100)).toBe('CIEN PESOS');
    expect(convertirMontoATexto(101)).toBe('CIENTO UN PESOS');
  });

  it('convierte un sueldo típico redondo', () => {
    expect(convertirMontoATexto(500000)).toBe('QUINIENTOS MIL PESOS');
  });

  it('usa "UN MILLON" en singular', () => {
    expect(convertirMontoATexto(1000000)).toBe('UN MILLON PESOS');
  });

  it('convierte millones en plural', () => {
    expect(convertirMontoATexto(2300000)).toBe('DOS MILLONES TRESCIENTOS MIL PESOS');
  });

  it('redondea montos con decimales', () => {
    expect(convertirMontoATexto(515000.4)).toBe('QUINIENTOS QUINCE MIL PESOS');
  });
});
