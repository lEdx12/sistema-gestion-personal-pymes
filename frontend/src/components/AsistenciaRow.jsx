import { useState } from 'react';
import { IconEdit } from './icons';

function valoresIniciales(registro) {
  return {
    hora_entrada: registro.hora_entrada ? registro.hora_entrada.slice(0, 5) : '',
    hora_salida: registro.hora_salida ? registro.hora_salida.slice(0, 5) : '',
    ausente: registro.ausente,
    justificacion: registro.justificacion || '',
  };
}

function AsistenciaRow({ registro, onMarcarSalida, onActualizar }) {
  const [horaSalida, setHoraSalida] = useState('');
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState(() => valoresIniciales(registro));
  const [error, setError] = useState(null);

  const puedeMarcarSalida = !registro.ausente && registro.hora_entrada && !registro.hora_salida;

  async function handleSalida() {
    if (!horaSalida) return;
    await onMarcarSalida(registro.id, horaSalida);
    setHoraSalida('');
  }

  function handleEditar() {
    setForm(valoresIniciales(registro));
    setError(null);
    setEditando(true);
  }

  async function handleGuardar() {
    setError(null);
    try {
      await onActualizar(registro.id, {
        hora_entrada: form.ausente ? undefined : form.hora_entrada,
        hora_salida: form.ausente ? undefined : form.hora_salida || null,
        ausente: form.ausente,
        justificacion: form.justificacion,
      });
      setEditando(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar el registro');
    }
  }

  if (editando) {
    return (
      <tr>
        <td>{registro.fecha?.slice(0, 10)}</td>
        <td colSpan="6">
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <label>
              <input
                type="checkbox"
                checked={form.ausente}
                onChange={(e) => setForm({ ...form, ausente: e.target.checked })}
              />{' '}
              Ausente
            </label>
            {!form.ausente && (
              <>
                <input
                  type="time"
                  value={form.hora_entrada}
                  onChange={(e) => setForm({ ...form, hora_entrada: e.target.value })}
                  title="Hora de entrada"
                  style={{ width: '6rem' }}
                />
                <input
                  type="time"
                  value={form.hora_salida}
                  onChange={(e) => setForm({ ...form, hora_salida: e.target.value })}
                  title="Hora de salida"
                  style={{ width: '6rem' }}
                />
              </>
            )}
            <input
              type="text"
              value={form.justificacion}
              onChange={(e) => setForm({ ...form, justificacion: e.target.value })}
              placeholder="Justificación"
              style={{ flex: 1, minWidth: '140px' }}
            />
            <button type="button" className="btn-primary" onClick={handleGuardar}>
              Guardar
            </button>
            <button type="button" className="btn-ghost" onClick={() => setEditando(false)}>
              Cancelar
            </button>
          </div>
          {error && <div className="field-error" style={{ fontSize: '0.85em' }}>{error}</div>}
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td>{registro.fecha?.slice(0, 10)}</td>
      <td>{registro.ausente ? '—' : registro.hora_entrada?.slice(0, 5) || '—'}</td>
      <td>{registro.ausente ? '—' : registro.hora_salida?.slice(0, 5) || '—'}</td>
      <td>{registro.horas_trabajadas ?? '—'}</td>
      <td>
        <span className={`status-badge ${registro.ausente ? 'off' : 'ok'}`}>
          {registro.ausente ? 'Sí' : 'No'}
        </span>
      </td>
      <td>{registro.justificacion || ''}</td>
      <td>
        <div className="row-actions">
          {puedeMarcarSalida && (
            <>
              <input
                type="time"
                value={horaSalida}
                onChange={(e) => setHoraSalida(e.target.value)}
                style={{ width: '6rem' }}
              />
              <button type="button" onClick={handleSalida}>
                Marcar salida
              </button>
            </>
          )}
          <button type="button" className="btn-icon" onClick={handleEditar} title="Editar">
            <IconEdit />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default AsistenciaRow;
