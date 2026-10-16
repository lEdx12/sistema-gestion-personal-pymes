import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listarEmpleados } from '../services/empleados.service';
import { obtenerReporteMensual } from '../services/reportes.service';

function ReporteAsistencia() {
  const [searchParams] = useSearchParams();
  const [empleados, setEmpleados] = useState([]);
  const [empleadoId, setEmpleadoId] = useState(searchParams.get('empleado_id') || '');
  const [periodo, setPeriodo] = useState('');
  const [reporte, setReporte] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    listarEmpleados().then(setEmpleados);
  }, []);

  async function handleGenerar(e) {
    e.preventDefault();
    setError(null);
    setReporte(null);
    try {
      const data = await obtenerReporteMensual({ empleadoId: empleadoId || undefined, periodo });
      setReporte(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al generar el reporte');
    }
  }

  return (
    <div>
      <h1>Reporte de asistencia mensual</h1>

      <form onSubmit={handleGenerar} className="card" style={{ display: 'grid', gap: '0.5rem', maxWidth: 320, marginBottom: '1.5rem' }}>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85em', gap: '0.15rem' }}>
          Empleado
          <select value={empleadoId} onChange={(e) => setEmpleadoId(e.target.value)}>
            <option value="">Todos (consolidado)</option>
            {empleados.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.nombre} {emp.apellido} ({emp.rut})
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85em', gap: '0.15rem' }}>
          Período
          <input type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)} required />
        </label>
        {error && <p className="field-error">{error}</p>}
        <button type="submit">Generar reporte</button>
      </form>

      {reporte && reporte.empleado && (
        <>
          <h2>
            {reporte.empleado.nombre} {reporte.empleado.apellido} ({reporte.empleado.rut}) — {reporte.periodo}
          </h2>
          <p>
            Días trabajados: <strong>{reporte.diasTrabajados}</strong> — Días de ausencia:{' '}
            <strong>{reporte.diasAusentes}</strong> — Horas totales: <strong>{reporte.totalHoras}</strong> —
            Horas de sobrejornada: <strong>{reporte.horasSobrejornada}</strong>
          </p>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Entrada</th>
                <th>Salida</th>
                <th>Horas trabajadas</th>
                <th>Ausente</th>
                <th>Justificación</th>
              </tr>
            </thead>
            <tbody>
              {reporte.registros.map((r) => (
                <tr key={r.id}>
                  <td>{r.fecha?.slice(0, 10)}</td>
                  <td>{r.ausente ? '—' : r.hora_entrada?.slice(0, 5) || '—'}</td>
                  <td>{r.ausente ? '—' : r.hora_salida?.slice(0, 5) || '—'}</td>
                  <td>{r.horas_trabajadas ?? '—'}</td>
                  <td>
                    <span className={`status-badge ${r.ausente ? 'off' : 'ok'}`}>{r.ausente ? 'Sí' : 'No'}</span>
                  </td>
                  <td>{r.justificacion || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {reporte && reporte.empleados && (
        <>
          <h2>Consolidado — {reporte.periodo}</h2>
          <table>
            <thead>
              <tr>
                <th>RUT</th>
                <th>Nombre</th>
                <th>Días trabajados</th>
                <th>Días de ausencia</th>
                <th>Horas totales</th>
                <th>Horas de sobrejornada</th>
              </tr>
            </thead>
            <tbody>
              {reporte.empleados.map((e) => (
                <tr key={e.empleado_id}>
                  <td>{e.rut}</td>
                  <td>
                    {e.nombre} {e.apellido}
                  </td>
                  <td>{e.diasTrabajados}</td>
                  <td>{e.diasAusentes}</td>
                  <td>{e.totalHoras}</td>
                  <td>{e.horasSobrejornada}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default ReporteAsistencia;
