/** Barra de paginación reutilizable para los listados (RF: filtros y paginación). */
function Paginacion({ pagina, totalPaginas, total, onCambiarPagina }) {
  if (!totalPaginas || totalPaginas <= 1) return null;

  return (
    <div className="paginacion">
      <span className="paginacion-info">
        Página {pagina} de {totalPaginas}
        {typeof total === 'number' ? ` — ${total} resultado(s)` : ''}
      </span>
      <div className="paginacion-botones">
        <button
          type="button"
          className="btn-ghost"
          disabled={pagina <= 1}
          onClick={() => onCambiarPagina(pagina - 1)}
        >
          ← Anterior
        </button>
        <button
          type="button"
          className="btn-ghost"
          disabled={pagina >= totalPaginas}
          onClick={() => onCambiarPagina(pagina + 1)}
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}

export default Paginacion;
