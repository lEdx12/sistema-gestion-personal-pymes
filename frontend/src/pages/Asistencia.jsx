import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import AsistenciaRow from '../components/AsistenciaRow';
import {
  listarAsistencia,
  marcarEntrada,
  marcarSalida,
  actualizarAsistencia,
  registrarAusencia,
  obtenerResumenSemanal,
} from '../services/asistencia.service';

const FORM_ENTRADA_VACIO = { fecha: '', hora_entrada: '' };
const FORM_AUSENCIA_VACIO = { fecha: '', justificacion: '' };
const FORM_RESUMEN_VACIO = { desde: '', hasta: '' };

function Asistencia() {
  const { empleadoId } = useParams();
  const [registros, setRegistros] = useState([]);
  const [error, setError] = useState(null);
  const [formEntrada, setFormEntrada] = useState(FORM_ENTRADA_VACIO);
  const [formAusencia, setFormAusencia] = useState(FORM_AUSENCIA_VACIO);
  const [formResumen, setFormResumen] = useState(FORM_RESUMEN_VACIO);
  const [resumen, setResumen] = useState(null);

  const cargar = useCallback(async () => {
    const data = await listarAsistencia(empleadoId);
    setRegistros(data);
  }, [empleadoId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function handleEntrada(e) {
    e.preventDefault();
    setError(null);
    try {
      await marcarEntrada({ ...formEntrada, empleado_id: Number(empleadoId) });
      setFormEntrada(FORM_ENTRADA_VACIO);
      await cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al marcar la entrada');
    }
  }

  async function handleAusencia(e) {
    e.preventDefault();
    setError(null);
    try {
      await registrarAusencia({ ...formAusencia, empleado_id: Number(empleadoId) });
      setFormAusencia(FORM_AUSENCIA_VACIO);
      await cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar la ausencia');
    }
  }

  async function handleMarcarSalida(id, horaSalida) {
    setError(null);
    try {
      await marcarSalida(id, horaSalida);
      await cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al marcar la salida');
    }
  }

  async function handleActualizar(id, datos) {
    await actualizarAsistencia(id, datos);
    await cargar();
  }

  async function handleResumen(e) {
    e.preventDefault();
    setError(null);
    setResumen(null);
    try {
      const data = await obtenerResumenSemanal(empleadoId, formResumen.desde, formResumen.hasta);
      setResumen(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al calcular el resumen');
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <Link to="/empleados" className="back-link">
            ← Volver a empleados
          </Link>
          <h1>Asistencia del empleado #{empleadoId}</h1>
          <p className="page-subtitle">
            <Link to={`/reportes/asistencia?empleado_id=${empleadoId}`}>Ver reporte mensual →</Link>
          </p>
        </div>
      </div>

      {error && <p className="field-error">{error}</p>}

      <div className="toolbar">
        <form onSubmit={handleEntrada} className="card form-grid">
          <h2>Marcar entrada</h2>
          <input
            type="date"
            value={formEntrada.fecha}
            onChange={(e) => setFormEntrada({ ...formEntrada, fecha: e.target.value })}
            required
          />
          <input
            type="time"
            value={formEntrada.hora_entrada}
            onChange={(e) => setFormEntrada({ ...formEntrada, hora_entrada: e.target.value })}
            required
          />
          <button type="submit">Marcar entrada</button>
        </form>

        <form onSubmit={handleAusencia} className="card form-grid">
          <h2>Registrar ausencia</h2>
          <input
            type="date"
            value={formAusencia.fecha}
            onChange={(e) => setFormAusencia({ ...formAusencia, fecha: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Justificación"
            value={formAusencia.justificacion}
            onChange={(e) => setFormAusencia({ ...formAusencia, justificacion: e.target.value })}
            required
          />
          <button type="submit">Registrar ausencia</button>
        </form>

        <form onSubmit={handleResumen} className="card form-grid">
          <h2>Resumen semanal</h2>
          <input
            type="date"
            value={formResumen.desde}
            onChange={(e) => setFormResumen({ ...formResumen, desde: e.target.value })}
            required
          />
          <input
            type="date"
            value={formResumen.hasta}
            onChange={(e) => setFormResumen({ ...formResumen, hasta: e.target.value })}
            required
          />
          <button type="submit">Calcular</button>
          {resumen && (
            <p style={{ fontSize: '0.85rem', margin: 0 }}>
              Total: {resumen.totalHoras} h — Sobrejornada: {resumen.horasSobrejornada} h (jornada
              máx.: {resumen.jornadaMaxHoras} h)
              <br />
              Valor hora ordinaria: ${resumen.valorHoraOrdinaria} — Monto horas extra: $
              {resumen.montoHorasExtra}
            </p>
          )}
        </form>
      </div>

      <div className="table-wrap">
        {registros.length === 0 ? (
          <div className="empty-state">Todavía no hay registros de asistencia.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Entrada</th>
                <th>Salida</th>
                <th>Horas trabajadas</th>
                <th>Ausente</th>
                <th>Justificación</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {registros.map((registro) => (
                <AsistenciaRow
                  key={registro.id}
                  registro={registro}
                  onMarcarSalida={handleMarcarSalida}
                  onActualizar={handleActualizar}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Asistencia;
