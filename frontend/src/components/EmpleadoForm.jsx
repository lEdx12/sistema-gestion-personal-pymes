import { useState } from 'react';

const VACIO = {
  rut: '',
  nombre: '',
  apellido: '',
  fecha_ingreso: '',
  cargo: '',
  sueldo_base: '',
  email: '',
  telefono: '',
};

function EmpleadoForm({ onSubmit, error }) {
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
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.5rem', maxWidth: 400 }}>
      <input name="rut" placeholder="RUT (12.345.678-5)" value={form.rut} onChange={handleChange} required />
      <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} required />
      <input name="apellido" placeholder="Apellido" value={form.apellido} onChange={handleChange} required />
      <input
        name="fecha_ingreso"
        type="date"
        value={form.fecha_ingreso}
        onChange={handleChange}
        required
      />
      <input name="cargo" placeholder="Cargo" value={form.cargo} onChange={handleChange} />
      <input
        name="sueldo_base"
        type="number"
        placeholder="Sueldo base"
        value={form.sueldo_base}
        onChange={handleChange}
        required
      />
      <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} />
      <input name="telefono" placeholder="Teléfono" value={form.telefono} onChange={handleChange} />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit">Registrar empleado</button>
    </form>
  );
}

export default EmpleadoForm;
