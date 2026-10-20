import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_ORIGIN } from '../services/api';
import { listarDocumentos, subirDocumento, eliminarDocumento } from '../services/documentos.service';

function resolverUrl(url) {
  return url.startsWith('http') ? url : `${API_ORIGIN}${url}`;
}

function Documentos() {
  const { empleadoId } = useParams();
  const [documentos, setDocumentos] = useState([]);
  const [archivo, setArchivo] = useState(null);
  const [tipo, setTipo] = useState('');
  const [error, setError] = useState(null);
  const [subiendo, setSubiendo] = useState(false);

  const cargar = useCallback(async () => {
    const data = await listarDocumentos(empleadoId);
    setDocumentos(data);
  }, [empleadoId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

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
      <p>
        <Link to="/empleados">← Volver a empleados</Link>
      </p>
      <h1>Documentos del empleado #{empleadoId}</h1>

      <form onSubmit={handleSubir} className="card" style={{ display: 'grid', gap: '0.5rem', maxWidth: 360, marginBottom: '1.5rem' }}>
        <h2>Subir documento</h2>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85em', gap: '0.15rem' }}>
          Tipo (opcional)
          <input
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            placeholder="ej. cédula, certificado, contrato firmado"
          />
        </label>
        <input
          type="file"
          accept="application/pdf,image/png,image/jpeg"
          onChange={(e) => setArchivo(e.target.files[0] || null)}
          required
        />
        {error && <p className="field-error">{error}</p>}
        <button type="submit" disabled={!archivo || subiendo}>
          {subiendo ? 'Subiendo...' : 'Subir documento'}
        </button>
      </form>

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
                <a href={resolverUrl(d.url)} target="_blank" rel="noreferrer">
                  Ver
                </a>{' '}
                <button type="button" onClick={() => handleEliminar(d.id)}>
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Documentos;
