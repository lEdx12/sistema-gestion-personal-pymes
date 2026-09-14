import { useState } from 'react';

function AsistenciaRow({ registro, onMarcarSalida }) {
  const [horaSalida, setHoraSalida] = useState('');
  const puedeMarcarSalida = !registro.ausente && registro.hora_entrada && !registro.hora_salida;

  async function handleSalida() {
    if (!horaSalida) return;
    await onMarcarSalida(registro.id, horaSalida);
    setHoraSalida('');
  }

  return (
    <tr>
      <td>{registro.fecha?.slice(0, 10)}</td>
      <td>{registro.ausente ? '—' : registro.hora_entrada?.slice(0, 5) || '—'}</td>
      <td>{registro.ausente ? '—' : registro.hora_salida?.slice(0, 5) || '—'}</td>
      <td>{registro.ausente ? 'Sí' : 'No'}</td>
      <td>{registro.justificacion || ''}</td>
      <td>
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
      </td>
    </tr>
  );
}

export default AsistenciaRow;
