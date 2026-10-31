import { useState } from 'react';

const VACIO = { tipo: 'indefinido', fecha_inicio: '', fecha_termino: '' };

function ContratoForm({ onSubmit, error, label }) {
  const [form, setForm] = useState(VACIO);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const ok = await onSubmit(form);
    if (ok) setForm(VACIO);
  }

  return (
    <form onSubmit={handleSubmit} className="form-grid">
      <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <label className="field">
          Tipo de contrato
          <select name="tipo" value={form.tipo} onChange={handleChange}>
            <option value="indefinido">Indefinido</option>
            <option value="plazo_fijo">Plazo fijo</option>
          </select>
        </label>
        <label className="field">
          Fecha de inicio
          <input name="fecha_inicio" type="date" value={form.fecha_inicio} onChange={handleChange} required />
        </label>
        {form.tipo === 'plazo_fijo' && (
          <label className="field">
            Fecha de término
            <input
              name="fecha_termino"
              type="date"
              value={form.fecha_termino}
              onChange={handleChange}
              required
            />
          </label>
        )}
      </div>
      {error && <p className="field-error">{error}</p>}
      <div className="form-actions">
        <button type="submit">{label}</button>
      </div>
    </form>
  );
}

export default ContratoForm;
