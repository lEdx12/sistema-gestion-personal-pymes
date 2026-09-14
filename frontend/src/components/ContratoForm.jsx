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
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.5rem', maxWidth: 350 }}>
      <select name="tipo" value={form.tipo} onChange={handleChange}>
        <option value="indefinido">Indefinido</option>
        <option value="plazo_fijo">Plazo fijo</option>
      </select>
      <input name="fecha_inicio" type="date" value={form.fecha_inicio} onChange={handleChange} required />
      {form.tipo === 'plazo_fijo' && (
        <input
          name="fecha_termino"
          type="date"
          value={form.fecha_termino}
          onChange={handleChange}
          required
        />
      )}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit">{label}</button>
    </form>
  );
}

export default ContratoForm;
