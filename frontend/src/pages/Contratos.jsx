import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ContratoForm from '../components/ContratoForm';
import ContratoDocumento from '../components/ContratoDocumento';
import Paginacion from '../components/Paginacion';
import {
  listarContratos,
  crearContrato,
  renovarContrato,
  subirDocumentoContrato,
} from '../services/contratos.service';

function Contratos() {
  const { empleadoId } = useParams();
  const [contratos, setContratos] = useState([]);
  const [paginacion, setPaginacion] = useState({ pagina: 1, totalPaginas: 1, total: 0 });
  const [pagina, setPagina] = useState(1);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    const data = await listarContratos(empleadoId, { pagina });
    setContratos(data.datos);
    setPaginacion({ pagina: data.pagina, totalPaginas: data.totalPaginas, total: data.total });
  }, [empleadoId, pagina]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const contratoActivo = contratos.find((c) => c.activo);

  async function handleCrear(form) {
    setError(null);
    try {
      await crearContrato({ ...form, empleado_id: Number(empleadoId) });
      await cargar();
      return true;
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear el contrato');
      return false;
    }
  }

  async function handleRenovar(form) {
    setError(null);
    try {
      await renovarContrato(contratoActivo.id, form);
      await cargar();
      return true;
    } catch (err) {
      setError(err.response?.data?.error || 'Error al renovar el contrato');
      return false;
    }
  }

  async function handleSubirDocumento(contratoId, archivo) {
    await subirDocumentoContrato(contratoId, archivo);
    await cargar();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <Link to="/empleados" className="back-link">
            ← Volver a empleados
          </Link>
          <h1>Contratos del empleado #{empleadoId}</h1>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        {contratoActivo ? (
          <>
            <h2>Renovar contrato activo</h2>
            <ContratoForm onSubmit={handleRenovar} error={error} label="Renovar contrato" />
          </>
        ) : (
          <>
            <h2>Crear primer contrato</h2>
            <ContratoForm onSubmit={handleCrear} error={error} label="Crear contrato" />
          </>
        )}
      </div>

      <div className="table-wrap">
        {contratos.length === 0 ? (
          <div className="empty-state">Este empleado todavía no tiene contratos.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Inicio</th>
                <th>Término</th>
                <th>Activo</th>
                <th>Documento</th>
              </tr>
            </thead>
            <tbody>
              {contratos.map((c) => (
                <tr key={c.id}>
                  <td>{c.tipo}</td>
                  <td>{c.fecha_inicio?.slice(0, 10)}</td>
                  <td>{c.fecha_termino?.slice(0, 10) || '—'}</td>
                  <td>
                    <span className={`status-badge ${c.activo ? 'ok' : 'off'}`}>
                      {c.activo ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td>
                    <ContratoDocumento contrato={c} onSubirDocumento={handleSubirDocumento} />
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

export default Contratos;
