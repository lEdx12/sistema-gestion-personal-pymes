const POR_PAGINA_DEFECTO = 10;
const POR_PAGINA_MAXIMA = 100;

/** Normaliza page/pageSize desde query string, con límites razonables. */
function normalizarPaginacion({ pagina, porPagina } = {}) {
  const paginaNormalizada = Math.max(1, parseInt(pagina, 10) || 1);
  const porPaginaNormalizada = Math.min(
    POR_PAGINA_MAXIMA,
    Math.max(1, parseInt(porPagina, 10) || POR_PAGINA_DEFECTO),
  );
  return { pagina: paginaNormalizada, porPagina: porPaginaNormalizada };
}

/** Pagina un arreglo ya filtrado/ordenado y devuelve el resultado con metadatos. */
function paginar(items, opciones) {
  const { pagina, porPagina } = normalizarPaginacion(opciones);
  const total = items.length;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
  const inicio = (pagina - 1) * porPagina;
  const datos = items.slice(inicio, inicio + porPagina);
  return { datos, total, pagina, porPagina, totalPaginas };
}

module.exports = { normalizarPaginacion, paginar };
