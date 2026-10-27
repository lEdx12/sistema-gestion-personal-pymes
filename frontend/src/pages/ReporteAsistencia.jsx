import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listarEmpleadosSelector } from '../services/empleados.service';
import { obtenerReporteMensual, descargarReporteMensualPdf } from '../services/reportes.service';

function ReporteAsistencia() {
  const [searchParams] = useSearchParams();
  const [empleados, setEmpleados] = useState([]);
  const [empleadoId, setEmpleadoId] = useState(searchParams.get('empleado_id') || '');
  const [periodo, setPeriodo] = useState('');
  const [reporte, setReporte] = useState(null);
  const [error, setError] = useState(null);
  const [descargando, setDescargando] = useState(false);

  useEffect(() => {
    // Selector acotado (id/rut/nombre): a diferencia de /api/empleados, también lo
    // puede usar el Gerente, para elegir a quién ver el reporte individual (RF-02).
    listarEmpleadosSelector()
      .then(setEmpleados)
      .catch(() => setEmpleados([]));
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

  async function handleDescargarPdf() {
    setError(null);
    setDescargando(true);
    try {
      const empleadoSeleccionado = empleados.find((e) => String(e.id) === String(empleadoId));
      const nombreEmpleado = empleadoSeleccionado
        ? `${empleadoSeleccionado.nombre} ${empleadoSeleccionado.apellido}`
        : undefined;
      await descargarReporteMensualPdf({ empleadoId: empleadoId || undefined, periodo, nombreEmpleado });
    } catch (err) {
      setError(err.response?.data?.error || 'Error al descargar el PDF');
    } finally {
      setDescargando(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Reporte de asistencia mensual</h1>
          <p className="page-subtitle">Resumen individual o consolidado de días trabajados y sobrejornada.</p>
        </div>
      </div>

      <form onSubmit={handleGenerar} className="card form-grid" style={{ maxWidth: 320, marginBottom: '1.5rem' }}>
        <label className="field">
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
        <label className="field">
          Período
          <input type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)} required />
        </label>
        {error && <p className="field-error">{error}</p>}
        <div className="form-actions">
          <button type="submit">Generar reporte</button>
          <button type="button" className="btn-ghost" onClick={handleDescargarPdf} disabled={!periodo || descargando}>
            {descargando ? 'Descargando...' : 'Descargar PDF'}
          </button>
        </div>
      </form>

      {reporte && reporte.empleado && (
        <div className="table-wrap">
          <div className="table-toolbar">
            <div>
              <h2 style={{ margin: 0 }}>
                {reporte.empleado.nombre} {reporte.empleado.apellido} ({reporte.empleado.rut})
              </h2>
              <p className="page-subtitle" style={{ margin: 0 }}>
                {reporte.periodo} — {reporte.diasTrabajados} día(s) trabajados, {reporte.diasAusentes} ausencia(s),{' '}
                {reporte.totalHoras} h totales, {reporte.horasSobrejornada} h de sobrejornada
              </p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Entrada</th>
                <th>Salida</th>
                <th className="num">Horas trabajadas</th>
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
                  <td className="num">{r.horas_trabajadas ?? '—'}</td>
                  <td>
                    <span className={`status-badge ${r.ausente ? 'off' : 'ok'}`}>{r.ausente ? 'Sí' : 'No'}</span>
                  </td>
                  <td>{r.justificacion || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reporte && reporte.empleados && (
        <div className="table-wrap">
          <div className="table-toolbar">
            <h2 style={{ margin: 0 }}>Consolidado — {reporte.periodo}</h2>
          </div>
          {reporte.empleados.length === 0 ? (
            <div className="empty-state">No hay empleados activos para este período.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>RUT</th>
                  <th>Nombre</th>
                  <th className="num">Días trabajados</th>
                  <th className="num">Días de ausencia</th>
                  <th className="num">Horas totales</th>
                  <th className="num">Horas de sobrejornada</th>
                </tr>
              </thead>
              <tbody>
                {reporte.empleados.map((e) => (
                  <tr key={e.empleado_id}>
                    <td>{e.rut}</td>
                    <td>
                      {e.nombre} {e.apellido}
                    </td>
                    <td className="num">{e.diasTrabajados}</td>
                    <td className="num">{e.diasAusentes}</td>
                    <td className="num">{e.totalHoras}</td>
                    <td className="num">{e.horasSobrejornada}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default ReporteAsistencia;
