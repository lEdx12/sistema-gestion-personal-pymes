import { useState } from 'react';
import { API_ORIGIN } from '../services/api';

function ContratoDocumento({ contrato, onSubirDocumento }) {
  const [archivo, setArchivo] = useState(null);
  const [error, setError] = useState(null);
  const [subiendo, setSubiendo] = useState(false);

  async function handleSubir() {
    if (!archivo) return;
    setError(null);
    setSubiendo(true);
    try {
      await onSubirDocumento(contrato.id, archivo);
      setArchivo(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al subir el documento');
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      {contrato.documento_url && (
        <a href={`${API_ORIGIN}${contrato.documento_url}`} target="_blank" rel="noreferrer">
          Ver documento
        </a>
      )}
      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
        <input
          type="file"
          accept="application/pdf,image/png,image/jpeg"
          onChange={(e) => setArchivo(e.target.files[0] || null)}
          style={{ maxWidth: '140px' }}
        />
        <button type="button" onClick={handleSubir} disabled={!archivo || subiendo}>
          {contrato.documento_url ? 'Reemplazar' : 'Subir'}
        </button>
      </div>
      {error && <span style={{ color: 'red', fontSize: '0.85em' }}>{error}</span>}
    </div>
  );
}

export default ContratoDocumento;
