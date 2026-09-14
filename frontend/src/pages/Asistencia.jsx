import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import AsistenciaRow from '../components/AsistenciaRow';
import {
  listarAsistencia,
  marcarEntrada,
  marcarSalida,
  registrarAusencia,
} from '../services/asistencia.service';

const FORM_ENTRADA_VACIO = { fecha: '', hora_entrada: '' };
const FORM_AUSENCIA_VACIO = { fecha: '', justificacion: '' };

function Asistencia() {
  const { empleadoId } = useParams();
  const [registros, setRegistros] = useState([]);
  const [error, setError] = useState(null);
  const [formEntrada, setFormEntrada] = useState(FORM_ENTRADA_VACIO);
  const [formAusencia, setFormAusencia] = useState(FORM_AUSENCIA_VACIO);

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

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <p>
        <Link to="/empleados">&larr; Volver a empleados</Link>
      </p>
      <h1>Asistencia del empleado #{empleadoId}</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
        <form onSubmit={handleEntrada} style={{ display: 'grid', gap: '0.5rem', maxWidth: 250 }}>
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

        <form onSubmit={handleAusencia} style={{ display: 'grid', gap: '0.5rem', maxWidth: 250 }}>
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
      </div>

      <table style={{ marginTop: '2rem', borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Entrada</th>
            <th>Salida</th>
            <th>Ausente</th>
            <th>Justificación</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {registros.map((registro) => (
            <AsistenciaRow key={registro.id} registro={registro} onMarcarSalida={handleMarcarSalida} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Asistencia;
