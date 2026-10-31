import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_ORIGIN } from '../services/api';
import { listarDocumentos, subirDocumento, eliminarDocumento } from '../services/documentos.service';
import { IconEye, IconTrash } from '../components/icons';
import Paginacion from '../components/Paginacion';

function resolverUrl(url) {
  return url.startsWith('http') ? url : `${API_ORIGIN}${url}`;
}

function Documentos() {
  const { empleadoId } = useParams();
  const [documentos, setDocumentos] = useState([]);
  const [paginacion, setPaginacion] = useState({ pagina: 1, totalPaginas: 1, total: 0 });
  const [filtroTipo, setFiltroTipo] = useState('');
  const [pagina, setPagina] = useState(1);
  const [archivo, setArchivo] = useState(null);
  const [tipo, setTipo] = useState('');
  const [error, setError] = useState(null);
  const [subiendo, setSubiendo] = useState(false);

  const cargar = useCallback(async () => {
    const data = await listarDocumentos(empleadoId, { tipo: filtroTipo || undefined, pagina });
    setDocumentos(data.datos);
    setPaginacion({ pagina: data.pagina, totalPaginas: data.totalPaginas, total: data.total });
  }, [empleadoId, filtroTipo, pagina]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    setPagina(1);
  }, [filtroTipo]);

  async function handleSubir(e) {
    e.preventDefault();
    if (!archivo) return;
    setError(null);
    setSubiendo(true);
    try {
      await subirDocumento(empleadoId, archivo, tipo);
      setArchivo(null);
      setTipo('');
      e.target.reset();
      await cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al subir el documento');
    } finally {
      setSubiendo(false);
    }
  }

  async function handleEliminar(id) {
    await eliminarDocumento(id);
    await cargar();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <Link to="/empleados" className="back-link">
            ← Volver a empleados
          </Link>
          <h1>Documentos del empleado #{empleadoId}</h1>
        </div>
      </div>

      <form onSubmit={handleSubir} className="card form-grid" style={{ marginBottom: '1.5rem' }}>
        <h2>Subir documento</h2>
        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <label className="field">
            Tipo (opcional)
            <input
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              placeholder="ej. cédula, certificado, contrato firmado"
            />
          </label>
          <label className="field">
            Archivo
            <input
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              onChange={(e) => setArchivo(e.target.files[0] || null)}
              required
            />
          </label>
        </div>
        {error && <p className="field-error">{error}</p>}
        <button type="submit" disabled={!archivo || subiendo}>
          {subiendo ? 'Subiendo...' : 'Subir documento'}
        </button>
      </form>

      <div className="table-wrap">
        <div className="table-toolbar">
          <h2 style={{ margin: 0 }}>{paginacion.total} documento(s)</h2>
          <div className="filtros-bar">
            <input
              type="search"
              placeholder="Filtrar por tipo..."
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
            />
          </div>
        </div>
        {documentos.length === 0 ? (
          <div className="empty-state">Este empleado todavía no tiene documentos adjuntos.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Subido</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {documentos.map((d) => (
                <tr key={d.id}>
                  <td>{d.nombre}</td>
                  <td>{d.tipo}</td>
                  <td>{d.created_at?.slice(0, 10)}</td>
                  <td>
                    <div className="row-actions">
                      <a
                        className="btn-icon"
                        href={resolverUrl(d.url)}
                        target="_blank"
                        rel="noreferrer"
                        title="Ver documento"
                      >
                        <IconEye />
                      </a>
                      <button
                        type="button"
                        className="btn-icon btn-danger"
                        onClick={() => handleEliminar(d.id)}
                        title="Eliminar"
                      >
                        <IconTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Paginacion
          pagina={paginacion.pagina}
          totalPaginas={paginacion.totalPaginas}
          total={paginacion.total}
          onCambiarPagina={setPagina}
        />
      </div>
    </div>
  );
}

export default Documentos;
