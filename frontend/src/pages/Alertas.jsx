import { useCallback, useEffect, useState } from 'react';
import { listarAlertas, marcarAlertaLeida, generarAlertas } from '../services/alertas.service';
import { IconCheck } from '../components/icons';
import Paginacion from '../components/Paginacion';

function formatearFecha(fecha) {
  return fecha?.slice(0, 10);
}

function Alertas() {
  const [alertas, setAlertas] = useState([]);
  const [paginacion, setPaginacion] = useState({ pagina: 1, totalPaginas: 1, total: 0 });
  const [soloNoLeidas, setSoloNoLeidas] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [error, setError] = useState(null);
  const [generando, setGenerando] = useState(false);

  const cargar = useCallback(async () => {
    const data = await listarAlertas({ soloNoLeidas, pagina });
    setAlertas(data.datos);
    setPaginacion({ pagina: data.pagina, totalPaginas: data.totalPaginas, total: data.total });
  }, [soloNoLeidas, pagina]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useEffect(() => {
    setPagina(1);
  }, [soloNoLeidas]);

  async function handleMarcarLeida(id) {
    await marcarAlertaLeida(id);
    await cargar();
  }

  async function handleGenerar() {
    setError(null);
    setGenerando(true);
    try {
      await generarAlertas();
      await cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al generar alertas');
    } finally {
      setGenerando(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Alertas de vencimiento de contratos</h1>
          <p className="page-subtitle">Contratos a plazo fijo próximos a vencer.</p>
        </div>
        <button type="button" className="btn-primary" onClick={handleGenerar} disabled={generando}>
          {generando ? 'Revisando...' : 'Revisar vencimientos ahora'}
        </button>
      </div>

      {error && <p className="field-error">{error}</p>}

      <div className="table-wrap">
        <div className="table-toolbar">
          <h2 style={{ margin: 0 }}>{paginacion.total} alerta(s)</h2>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={soloNoLeidas}
              onChange={(e) => setSoloNoLeidas(e.target.checked)}
            />
            Mostrar solo no leídas
          </label>
        </div>

        {alertas.length === 0 ? (
          <div className="empty-state">No hay alertas{soloNoLeidas ? ' pendientes' : ''}.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Empleado</th>
                <th>Mensaje</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {alertas.map((a) => (
                <tr key={a.id}>
                  <td>{formatearFecha(a.fecha_alerta)}</td>
                  <td>
                    {a.empleado_nombre} {a.empleado_apellido} ({a.empleado_rut})
                  </td>
                  <td>{a.mensaje}</td>
                  <td>
                    <span className={`status-badge ${a.leida ? 'muted' : 'warn'}`}>
                      {a.leida ? 'Leída' : 'Pendiente'}
                    </span>
                  </td>
                  <td>
                    {!a.leida && (
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => handleMarcarLeida(a.id)}
                        title="Marcar como leída"
                      >
                        <IconCheck />
                      </button>
                    )}
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

export default Alertas;
