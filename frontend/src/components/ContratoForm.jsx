import { useState } from 'react';

const VACIO = { tipo: 'indefinido', fecha_inicio: '', fecha_termino: '' };
const estiloCampo = { display: 'flex', flexDirection: 'column', fontSize: '0.85em', gap: '0.15rem' };

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
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.5rem', maxWidth: 350 }}>
      <label style={estiloCampo}>
        Tipo de contrato
        <select name="tipo" value={form.tipo} onChange={handleChange}>
          <option value="indefinido">Indefinido</option>
          <option value="plazo_fijo">Plazo fijo</option>
        </select>
      </label>
      <label style={estiloCampo}>
        Fecha de inicio
        <input name="fecha_inicio" type="date" value={form.fecha_inicio} onChange={handleChange} required />
      </label>
      {form.tipo === 'plazo_fijo' && (
        <label style={estiloCampo}>
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
      {error && <p className="field-error">{error}</p>}
      <button type="submit">{label}</button>
    </form>
  );
}

export default ContratoForm;
