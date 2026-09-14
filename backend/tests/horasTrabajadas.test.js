const {
  calcularHorasTrabajadas,
  calcularSobrejornadaSemanal,
} = require('../src/services/horasTrabajadas.service');

describe('calcularHorasTrabajadas', () => {
  it('calcula una jornada completa de 9 horas', () => {
    expect(calcularHorasTrabajadas('08:00', '17:00')).toBe(9);
  });

  it('calcula jornadas con fracciones de hora', () => {
    expect(calcularHorasTrabajadas('08:00', '12:30')).toBe(4.5);
  });

  it('lanza error si la entrada y la salida son la misma hora (duración ambigua)', () => {
    expect(() => calcularHorasTrabajadas('08:00', '08:00')).toThrow();
  });

  it('calcula un turno nocturno que cruza la medianoche', () => {
    expect(calcularHorasTrabajadas('22:00', '06:00')).toBe(8);
  });

  it('calcula un turno nocturno corto que cruza la medianoche', () => {
    expect(calcularHorasTrabajadas('23:30', '00:30')).toBe(1);
  });
});

describe('calcularSobrejornadaSemanal', () => {
  it('CP-05: detecta 5 horas de sobrejornada con 50 horas trabajadas (jornada 45h)', () => {
    const resultado = calcularSobrejornadaSemanal([10, 10, 10, 10, 10]);
    expect(resultado.totalHoras).toBe(50);
    expect(resultado.horasSobrejornada).toBe(5);
    expect(resultado.jornadaMaxHoras).toBe(45);
  });

  it('no reporta sobrejornada si el total no supera la jornada máxima', () => {
    const resultado = calcularSobrejornadaSemanal([9, 9, 9, 9, 9]);
    expect(resultado.totalHoras).toBe(45);
    expect(resultado.horasSobrejornada).toBe(0);
  });

  it('permite una jornada máxima configurable', () => {
    const resultado = calcularSobrejornadaSemanal([10, 10], 15);
    expect(resultado.totalHoras).toBe(20);
    expect(resultado.horasSobrejornada).toBe(5);
    expect(resultado.jornadaMaxHoras).toBe(15);
  });

  it('ignora días sin horas registradas (ausencias)', () => {
    const resultado = calcularSobrejornadaSemanal([9, 9, null, 9, 9]);
    expect(resultado.totalHoras).toBe(36);
  });
});
