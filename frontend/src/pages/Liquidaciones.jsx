import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import {
  descargarLiquidacionPdf,
  generarLiquidacion,
  obtenerHistorialRemuneraciones,
} from '../services/liquidaciones.service';

function formatearMonto(valor) {
  return Number(valor).toLocaleString('es-CL');
}

function Liquidaciones() {
  const { empleadoId } = useParams();
  const { usuario } = useAuth();
  const esAdministrador = usuario?.rol === 'administrador';
  const [historial, setHistorial] = useState(null);
  const [periodo, setPeriodo] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [error, setError] = useState(null);
  const [errorFiltro, setErrorFiltro] = useState(null);
  const [errorPdf, setErrorPdf] = useState(null);

  const cargar = useCallback(
    async (filtroDesde, filtroHasta) => {
      const data = await obtenerHistorialRemuneraciones(empleadoId, filtroDesde, filtroHasta);
      setHistorial(data);
    },
    [empleadoId],
  );

  useEffect(() => {
    cargar('', '');
  }, [cargar]);

  async function handleGenerar(e) {
    e.preventDefault();
    setError(null);
    try {
      await generarLiquidacion(Number(empleadoId), periodo);
      setPeriodo('');
      await cargar(desde, hasta);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al generar la liquidación');
    }
  }

  async function handleDescargarPdf(liquidacion) {
    setErrorPdf(null);
    try {
      await descargarLiquidacionPdf(liquidacion.id, liquidacion.periodo);
    } catch {
      setErrorPdf('Error al descargar el PDF');
    }
  }

  async function handleFiltrar(e) {
    e.preventDefault();
    setErrorFiltro(null);
    try {
      await cargar(desde, hasta);
    } catch (err) {
      setErrorFiltro(err.response?.data?.error || 'Error al filtrar el historial');
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <Link to={esAdministrador ? '/empleados' : '/'} className="back-link">
            ← Volver
          </Link>
          <h1>Liquidaciones del empleado #{empleadoId}</h1>
          {historial && (
            <p className="page-subtitle">
              {historial.cantidad} liquidación(es)
              {historial.desde || historial.hasta ? ' en el rango seleccionado' : ''}
              {historial.cantidad > 0 && (
                <>
                  {' '}— Total líquido: <strong>${formatearMonto(historial.totalLiquido)}</strong> — Promedio:{' '}
                  <strong>${formatearMonto(historial.promedioLiquido)}</strong>
                </>
              )}
            </p>
          )}
        </div>
      </div>

      <div className="toolbar">
        {esAdministrador && (
          <form onSubmit={handleGenerar} className="card form-grid">
            <h2>Generar liquidación</h2>
            <label className="field">
              Período
              <input type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)} required />
            </label>
            {error && <p className="field-error">{error}</p>}
            <button type="submit">Generar liquidación</button>
          </form>
        )}

        <form onSubmit={handleFiltrar} className="card form-grid">
          <h2>Filtrar historial por fecha</h2>
          <label className="field">
            Desde
            <input type="month" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </label>
          <label className="field">
            Hasta
            <input type="month" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </label>
          {errorFiltro && <p className="field-error">{errorFiltro}</p>}
          <button type="submit">Filtrar</button>
        </form>
      </div>

      {errorPdf && <p className="field-error">{errorPdf}</p>}

      <div className="table-wrap">
        {(historial?.liquidaciones || []).length === 0 ? (
          <div className="empty-state">No hay liquidaciones para mostrar.</div>
        ) : (
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
                <th></th>
              </tr>
            </thead>
            <tbody>
              {historial.liquidaciones.map((l) => (
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
                  <td>
                    <button type="button" onClick={() => handleDescargarPdf(l)}>
                      Descargar PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Liquidaciones;
