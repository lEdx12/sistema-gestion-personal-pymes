import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { listarLiquidaciones, generarLiquidacion } from '../services/liquidaciones.service';

function formatearMonto(valor) {
  return Number(valor).toLocaleString('es-CL');
}

function Liquidaciones() {
  const { empleadoId } = useParams();
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [periodo, setPeriodo] = useState('');
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    const data = await listarLiquidaciones(empleadoId);
    setLiquidaciones(data);
  }, [empleadoId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function handleGenerar(e) {
    e.preventDefault();
    setError(null);
    try {
      await generarLiquidacion(Number(empleadoId), periodo);
      setPeriodo('');
      await cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al generar la liquidación');
    }
  }

  return (
    <div>
      <p>
        <Link to="/empleados">← Volver a empleados</Link>
      </p>
      <h1>Liquidaciones del empleado #{empleadoId}</h1>

      <form onSubmit={handleGenerar} className="card" style={{ display: 'grid', gap: '0.5rem', maxWidth: 280, marginBottom: '1.5rem' }}>
        <h2>Generar liquidación</h2>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85em', gap: '0.15rem' }}>
          Período
          <input
            type="month"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            required
          />
        </label>
        {error && <p className="field-error">{error}</p>}
        <button type="submit">Generar liquidación</button>
      </form>

      <table>
        <thead>
          <tr>
            <th>Período</th>
            <th>Sueldo base</th>
            <th>Horas extra</th>
            <th>Gratificación</th>
            <th>Desc. AFP</th>
            <th>Desc. salud</th>
            <th>Desc. cesantía</th>
            <th>Total haberes</th>
            <th>Total descuentos</th>
            <th>Líquido a pagar</th>
          </tr>
        </thead>
        <tbody>
          {liquidaciones.map((l) => (
            <tr key={l.id}>
              <td>{l.periodo}</td>
              <td>${formatearMonto(l.sueldo_base)}</td>
              <td>${formatearMonto(l.horas_extra_monto)}</td>
              <td>${formatearMonto(l.gratificacion)}</td>
              <td>${formatearMonto(l.descuento_afp)}</td>
              <td>${formatearMonto(l.descuento_salud)}</td>
              <td>${formatearMonto(l.descuento_cesantia)}</td>
              <td>${formatearMonto(l.total_haberes)}</td>
              <td>${formatearMonto(l.total_descuentos)}</td>
              <td>
                <strong>${formatearMonto(l.liquido_pagar)}</strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Liquidaciones;
