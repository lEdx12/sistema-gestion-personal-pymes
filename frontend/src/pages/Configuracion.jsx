import { useCallback, useEffect, useState } from 'react';
import {
  obtenerConfiguracion,
  actualizarConfiguracion,
  listarTramosImpuesto,
  actualizarTramosImpuesto,
} from '../services/configuracion.service';
import { IconTrash, IconPlus } from '../components/icons';

/** La configuración guarda porcentajes como decimal (0.1 = 10%); el formulario los
 * muestra como número entero/decimal legible (10 = 10%). */
function decimalAPorcentaje(valor) {
  if (valor === null || valor === undefined || valor === '') return '';
  // Redondeo a 4 decimales para evitar artefactos de punto flotante (ej. 0.07*100).
  return String(Math.round(Number(valor) * 100 * 10000) / 10000);
}
function porcentajeADecimal(valor) {
  return Number(valor) / 100;
}

function valoresFormularioDesdeConfig(config) {
  return {
    afp_porcentaje: decimalAPorcentaje(config.afp_porcentaje),
    salud_porcentaje: decimalAPorcentaje(config.salud_porcentaje),
    afc_indefinido_porcentaje: decimalAPorcentaje(config.afc_indefinido_porcentaje),
    afc_plazo_fijo_porcentaje: decimalAPorcentaje(config.afc_plazo_fijo_porcentaje),
    gratificacion_porcentaje: decimalAPorcentaje(config.gratificacion_porcentaje),
    gratificacion_tope_mensual: String(config.gratificacion_tope_mensual ?? ''),
    movilizacion_monto: String(config.movilizacion_monto ?? ''),
    colacion_monto: String(config.colacion_monto ?? ''),
    valor_utm: String(config.valor_utm ?? ''),
  };
}

function filaFormularioDesdeTramo(tramo) {
  return {
    desde_utm: String(tramo.desde_utm ?? ''),
    hasta_utm: tramo.hasta_utm === null || tramo.hasta_utm === undefined ? '' : String(tramo.hasta_utm),
    factor: decimalAPorcentaje(tramo.factor),
    rebaja_utm: String(tramo.rebaja_utm ?? ''),
  };
}

function Configuracion() {
  const [form, setForm] = useState(null);
  const [tramos, setTramos] = useState([]);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  const [errorTramos, setErrorTramos] = useState(null);
  const [exitoTramos, setExitoTramos] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [guardandoTramos, setGuardandoTramos] = useState(false);

  const cargar = useCallback(async () => {
    const [config, listaTramos] = await Promise.all([obtenerConfiguracion(), listarTramosImpuesto()]);
    setForm(valoresFormularioDesdeConfig(config));
    setTramos(listaTramos.map(filaFormularioDesdeTramo));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleGuardarConfig(e) {
    e.preventDefault();
    setError(null);
    setExito(null);
    setGuardando(true);
    try {
      await actualizarConfiguracion({
        afp_porcentaje: porcentajeADecimal(form.afp_porcentaje),
        salud_porcentaje: porcentajeADecimal(form.salud_porcentaje),
        afc_indefinido_porcentaje: porcentajeADecimal(form.afc_indefinido_porcentaje),
        afc_plazo_fijo_porcentaje: porcentajeADecimal(form.afc_plazo_fijo_porcentaje),
        gratificacion_porcentaje: porcentajeADecimal(form.gratificacion_porcentaje),
        gratificacion_tope_mensual: Number(form.gratificacion_tope_mensual),
        movilizacion_monto: Number(form.movilizacion_monto),
        colacion_monto: Number(form.colacion_monto),
        valor_utm: Number(form.valor_utm),
      });
      setExito('Configuración guardada.');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar la configuración');
    } finally {
      setGuardando(false);
    }
  }

  function handleCambiarTramo(indice, campo, valor) {
    setTramos(tramos.map((t, i) => (i === indice ? { ...t, [campo]: valor } : t)));
  }

  function handleAgregarTramo() {
    const anterior = tramos[tramos.length - 1];
    setTramos([
      ...tramos,
      { desde_utm: anterior?.hasta_utm || '', hasta_utm: '', factor: '', rebaja_utm: '0' },
    ]);
  }

  function handleEliminarUltimoTramo() {
    if (tramos.length <= 1) return;
    setTramos(tramos.slice(0, -1));
  }

  async function handleGuardarTramos(e) {
    e.preventDefault();
    setErrorTramos(null);
    setExitoTramos(null);
    setGuardandoTramos(true);
    try {
      const payload = tramos.map((t, indice) => ({
        orden: indice + 1,
        desde_utm: Number(t.desde_utm),
        hasta_utm: t.hasta_utm === '' ? null : Number(t.hasta_utm),
        factor: porcentajeADecimal(t.factor),
        rebaja_utm: Number(t.rebaja_utm),
      }));
      const actualizados = await actualizarTramosImpuesto(payload);
      setTramos(actualizados.map(filaFormularioDesdeTramo));
      setExitoTramos('Tabla de tramos guardada.');
    } catch (err) {
      setErrorTramos(err.response?.data?.error || 'Error al guardar los tramos');
    } finally {
      setGuardandoTramos(false);
    }
  }

  if (!form) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Configuración de sueldo</h1>
          <p className="page-subtitle">
            Porcentajes, montos fijos e impuesto único usados al generar liquidaciones. Los cambios
            solo afectan a las liquidaciones generadas de ahora en adelante.
          </p>
        </div>
      </div>

      <form onSubmit={handleGuardarConfig} className="card form-grid" style={{ marginBottom: '1.5rem' }}>
        <h2>Cotizaciones, gratificación y haberes fijos</h2>
        <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <label className="field">
            AFP (%)
            <input
              name="afp_porcentaje"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={form.afp_porcentaje}
              onChange={handleChange}
              required
            />
          </label>
          <label className="field">
            Salud (%)
            <input
              name="salud_porcentaje"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={form.salud_porcentaje}
              onChange={handleChange}
              required
            />
          </label>
          <label className="field">
            Seguro cesantía — indefinido (%)
            <input
              name="afc_indefinido_porcentaje"
              type="number"
              step="0.001"
              min="0"
              max="100"
              value={form.afc_indefinido_porcentaje}
              onChange={handleChange}
              required
            />
          </label>
          <label className="field">
            Seguro cesantía — plazo fijo (%)
            <input
              name="afc_plazo_fijo_porcentaje"
              type="number"
              step="0.001"
              min="0"
              max="100"
              value={form.afc_plazo_fijo_porcentaje}
              onChange={handleChange}
              required
            />
          </label>
          <label className="field">
            Gratificación legal (%)
            <input
              name="gratificacion_porcentaje"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={form.gratificacion_porcentaje}
              onChange={handleChange}
              required
            />
          </label>
          <label className="field">
            Tope mensual gratificación ($)
            <input
              name="gratificacion_tope_mensual"
              type="number"
              step="1"
              min="0"
              value={form.gratificacion_tope_mensual}
              onChange={handleChange}
              required
            />
          </label>
          <label className="field">
            Movilización ($, monto fijo mensual)
            <input
              name="movilizacion_monto"
              type="number"
              step="1"
              min="0"
              value={form.movilizacion_monto}
              onChange={handleChange}
              required
            />
          </label>
          <label className="field">
            Colación ($, monto fijo mensual)
            <input
              name="colacion_monto"
              type="number"
              step="1"
              min="0"
              value={form.colacion_monto}
              onChange={handleChange}
              required
            />
          </label>
          <label className="field">
            Valor UTM ($)
            <input
              name="valor_utm"
              type="number"
              step="1"
              min="0"
              value={form.valor_utm}
              onChange={handleChange}
              required
            />
          </label>
        </div>
        {error && <p className="field-error">{error}</p>}
        {exito && <p className="page-subtitle" style={{ color: 'var(--success)' }}>{exito}</p>}
        <div className="form-actions">
          <button type="submit" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </div>
      </form>

      <form onSubmit={handleGuardarTramos} className="card form-grid">
        <h2>Tramos del impuesto único (Segunda Categoría)</h2>
        <p className="page-subtitle" style={{ marginTop: 0 }}>
          Tabla progresiva por tramos expresados en UTM, igual que la tabla oficial del SII. Cada
          tramo debe continuar exactamente donde termina el anterior; solo el último puede quedar
          sin tope.
        </p>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tramo</th>
                <th>Desde (UTM)</th>
                <th>Hasta (UTM)</th>
                <th>Factor (%)</th>
                <th>Rebaja (UTM)</th>
              </tr>
            </thead>
            <tbody>
              {tramos.map((tramo, indice) => (
                <tr key={indice}>
                  <td>{indice + 1}</td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={tramo.desde_utm}
                      onChange={(e) => handleCambiarTramo(indice, 'desde_utm', e.target.value)}
                      style={{ width: '6rem' }}
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={indice === tramos.length - 1 ? 'sin tope' : ''}
                      value={tramo.hasta_utm}
                      onChange={(e) => handleCambiarTramo(indice, 'hasta_utm', e.target.value)}
                      style={{ width: '6rem' }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={tramo.factor}
                      onChange={(e) => handleCambiarTramo(indice, 'factor', e.target.value)}
                      style={{ width: '6rem' }}
                      required
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={tramo.rebaja_utm}
                      onChange={(e) => handleCambiarTramo(indice, 'rebaja_utm', e.target.value)}
                      style={{ width: '6rem' }}
                      required
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="form-actions">
          <button type="button" className="btn-ghost" onClick={handleAgregarTramo}>
            <IconPlus width={16} height={16} /> Agregar tramo
          </button>
          <button
            type="button"
            className="btn-ghost btn-danger"
            onClick={handleEliminarUltimoTramo}
            disabled={tramos.length <= 1}
          >
            <IconTrash width={16} height={16} /> Eliminar último tramo
          </button>
        </div>

        {errorTramos && <p className="field-error">{errorTramos}</p>}
        {exitoTramos && <p className="page-subtitle" style={{ color: 'var(--success)' }}>{exitoTramos}</p>}
        <div className="form-actions">
          <button type="submit" disabled={guardandoTramos}>
            {guardandoTramos ? 'Guardando...' : 'Guardar tramos'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Configuracion;
