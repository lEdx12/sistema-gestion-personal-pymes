const { horaAMinutos, esHoraPosterior } = require('../src/utils/horas');

describe('horaAMinutos', () => {
  it('convierte HH:MM a minutos desde medianoche', () => {
    expect(horaAMinutos('08:30')).toBe(510);
  });

  it('ignora los segundos si están presentes', () => {
    expect(horaAMinutos('08:30:45')).toBe(510);
  });
});

describe('esHoraPosterior', () => {
  it('es true cuando la segunda hora es mayor', () => {
    expect(esHoraPosterior('08:00', '17:00')).toBe(true);
  });

  it('es false cuando la segunda hora es menor o igual', () => {
    expect(esHoraPosterior('17:00', '08:00')).toBe(false);
    expect(esHoraPosterior('17:00', '17:00')).toBe(false);
  });
});
