const { normalizarPaginacion, paginar } = require('../src/utils/paginacion');

describe('normalizarPaginacion', () => {
  it('aplica valores por defecto si no se indican', () => {
    expect(normalizarPaginacion({})).toEqual({ pagina: 1, porPagina: 10 });
  });

  it('descarta valores inválidos o no numéricos', () => {
    expect(normalizarPaginacion({ pagina: 'abc', porPagina: 'xyz' })).toEqual({ pagina: 1, porPagina: 10 });
  });

  it('acota valores por debajo del mínimo a 1', () => {
    expect(normalizarPaginacion({ pagina: 0, porPagina: -5 })).toEqual({ pagina: 1, porPagina: 1 });
  });

  it('limita por_pagina a un máximo de 100', () => {
    expect(normalizarPaginacion({ porPagina: 500 })).toEqual({ pagina: 1, porPagina: 100 });
  });
});

describe('paginar', () => {
  const items = Array.from({ length: 25 }, (_, i) => i + 1);

  it('devuelve la primera página con los metadatos correctos', () => {
    const resultado = paginar(items, { pagina: 1, porPagina: 10 });
    expect(resultado).toEqual({
      datos: items.slice(0, 10),
      total: 25,
      pagina: 1,
      porPagina: 10,
      totalPaginas: 3,
    });
  });

  it('devuelve la última página parcial', () => {
    const resultado = paginar(items, { pagina: 3, porPagina: 10 });
    expect(resultado.datos).toEqual([21, 22, 23, 24, 25]);
  });

  it('devuelve un arreglo vacío si la página pedida no existe', () => {
    const resultado = paginar(items, { pagina: 10, porPagina: 10 });
    expect(resultado.datos).toEqual([]);
    expect(resultado.total).toBe(25);
  });

  it('con un arreglo vacío, totalPaginas es 1 (no 0)', () => {
    const resultado = paginar([], { pagina: 1, porPagina: 10 });
    expect(resultado).toEqual({ datos: [], total: 0, pagina: 1, porPagina: 10, totalPaginas: 1 });
  });
});
