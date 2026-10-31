import { useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { obtenerLiquidacion, descargarLiquidacionPdf } from '../services/liquidaciones.service';

function formatearMonto(valor) {
  return Number(valor).toLocaleString('es-CL');
}

function FilaDetalle({ etiqueta, valor, negrita }) {
  return (
    <div className="list-item">
      <div className="list-item-main">
        <div className={negrita ? 'list-item-title' : 'list-item-meta'}>{etiqueta}</div>
      </div>
      <span className={negrita ? 'list-item-title' : ''}>${formatearMonto(valor)}</span>
    </div>
  );
}

function LiquidacionDetalle() {
  const { id } = useParams();
  const [liquidacion, setLiquidacion] = useState(null);
  const [error, setError] = useState(null);
  const [errorPdf, setErrorPdf] = useState(null);
  const [descargando, setDescargando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const data = await obtenerLiquidacion(id);
      setLiquidacion(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cargar la liquidación');
    }
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function handleDescargarPdf() {
    setErrorPdf(null);
    setDescargando(true);
    try {
      const nombreEmpleado = `${liquidacion.empleado_nombre} ${liquidacion.empleado_apellido}`;
      await descargarLiquidacionPdf(liquidacion.id, liquidacion.periodo, nombreEmpleado);
    } catch {
      setErrorPdf('Error al descargar el PDF');
    } finally {
      setDescargando(false);
    }
  }

  if (error) {
    return (
      <div>
        <p className="field-error">{error}</p>
      </div>
    );
  }

  if (!liquidacion) return null;

  return (
    <div>
      <div className="page-header">
        <div>
          <Link to={`/empleados/${liquidacion.empleado_id}/liquidaciones`} className="back-link">
            ← Volver a liquidaciones
          </Link>
          <h1>
            Liquidación de {liquidacion.empleado_nombre} {liquidacion.empleado_apellido}
          </h1>
          <p className="page-subtitle">
            Período {liquidacion.periodo} — RUT {liquidacion.empleado_rut}
          </p>
        </div>
        <button type="button" onClick={handleDescargarPdf} disabled={descargando}>
          {descargando ? 'Descargando...' : 'Descargar PDF'}
        </button>
      </div>

      {errorPdf && <p className="field-error">{errorPdf}</p>}

      <div className="dashboard-grid">
        <div className="card">
          <h2>Haberes</h2>
          <FilaDetalle etiqueta="Sueldo base" valor={liquidacion.sueldo_base} />
          <FilaDetalle etiqueta="Horas extra" valor={liquidacion.horas_extra_monto} />
          <FilaDetalle etiqueta="Gratificación legal" valor={liquidacion.gratificacion} />
          <FilaDetalle etiqueta="Movilización" valor={liquidacion.movilizacion} />
          <FilaDetalle etiqueta="Colación" valor={liquidacion.colacion} />
          <FilaDetalle etiqueta="Total haberes" valor={liquidacion.total_haberes} negrita />
        </div>

        <div className="card">
          <h2>Descuentos</h2>
          <FilaDetalle etiqueta="AFP" valor={liquidacion.descuento_afp} />
          <FilaDetalle etiqueta="Salud" valor={liquidacion.descuento_salud} />
          <FilaDetalle etiqueta="Seguro cesantía" valor={liquidacion.descuento_cesantia} />
          <FilaDetalle etiqueta="Impuesto único" valor={liquidacion.descuento_impuesto} />
          {Number(liquidacion.otros_descuentos) > 0 && (
            <FilaDetalle etiqueta="Otros descuentos" valor={liquidacion.otros_descuentos} />
          )}
          <FilaDetalle etiqueta="Total descuentos" valor={liquidacion.total_descuentos} negrita />
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem', maxWidth: 420 }}>
        <div className="list-item">
          <div className="list-item-main">
            <div className="list-item-title" style={{ fontSize: '1.05rem' }}>
              Líquido a pagar
            </div>
          </div>
          <span className="list-item-title" style={{ fontSize: '1.2rem' }}>
            ${formatearMonto(liquidacion.liquido_pagar)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default LiquidacionDetalle;
