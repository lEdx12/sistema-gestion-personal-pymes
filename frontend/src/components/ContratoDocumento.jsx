import { useId, useState } from 'react';
import { API_ORIGIN } from '../services/api';

function ContratoDocumento({ contrato, onSubirDocumento }) {
  const inputId = useId();
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
          {contrato.documento_nombre || 'Ver documento'}
        </a>
      )}
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          id={inputId}
          type="file"
          accept="application/pdf,image/png,image/jpeg"
          onChange={(e) => setArchivo(e.target.files[0] || null)}
          style={{ display: 'none' }}
        />
        <label htmlFor={inputId} className="file-label" title={archivo?.name}>
          {archivo ? archivo.name : 'Seleccionar archivo'}
        </label>
        <button type="button" onClick={handleSubir} disabled={!archivo || subiendo}>
          {contrato.documento_url ? 'Reemplazar' : 'Subir'}
        </button>
      </div>
      {error && <span className="field-error" style={{ fontSize: '0.85em' }}>{error}</span>}
    </div>
  );
}

export default ContratoDocumento;
