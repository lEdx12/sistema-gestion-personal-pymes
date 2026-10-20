import { useCallback, useEffect, useState } from 'react';
import { listarAlertas, marcarAlertaLeida, generarAlertas } from '../services/alertas.service';

function formatearFecha(fecha) {
  return fecha?.slice(0, 10);
}

function Alertas() {
  const [alertas, setAlertas] = useState([]);
  const [soloNoLeidas, setSoloNoLeidas] = useState(true);
  const [error, setError] = useState(null);
  const [generando, setGenerando] = useState(false);

  const cargar = useCallback(async () => {
    const data = await listarAlertas(soloNoLeidas);
    setAlertas(data);
  }, [soloNoLeidas]);

  useEffect(() => {
    cargar();
  }, [cargar]);

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
      <h1>Alertas de vencimiento de contratos</h1>

      <div className="toolbar" style={{ marginBottom: '1.5rem', alignItems: 'center' }}>
        <button type="button" onClick={handleGenerar} disabled={generando}>
          {generando ? 'Revisando...' : 'Revisar vencimientos ahora'}
        </button>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <input
            type="checkbox"
            checked={soloNoLeidas}
            onChange={(e) => setSoloNoLeidas(e.target.checked)}
            style={{ width: 'auto' }}
          />
          Mostrar solo no leídas
        </label>
      </div>

      {error && <p className="field-error">{error}</p>}

      {alertas.length === 0 && <p>No hay alertas{soloNoLeidas ? ' pendientes' : ''}.</p>}

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
                <span className={`status-badge ${a.leida ? 'off' : 'ok'}`}>
                  {a.leida ? 'Leída' : 'Pendiente'}
                </span>
              </td>
              <td>
                {!a.leida && (
                  <button type="button" onClick={() => handleMarcarLeida(a.id)}>
                    Marcar como leída
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Alertas;
