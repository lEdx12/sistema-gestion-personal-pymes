import { useEffect, useState } from 'react';

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function valoresPorDefecto() {
  return {
    rut: '',
    nombre: '',
    apellido: '',
    fecha_ingreso: hoyISO(),
    fecha_nacimiento: '',
    direccion: '',
    cargo: '',
    sueldo_base: '',
    email: '',
    telefono: '',
  };
}

function valoresDesdeEmpleado(empleado) {
  return {
    rut: empleado.rut || '',
    nombre: empleado.nombre || '',
    apellido: empleado.apellido || '',
    // La fecha de ingreso no se muestra en el formulario: se fija al crear el
    // empleado y se conserva sin cambios al editar.
    fecha_ingreso: empleado.fecha_ingreso ? empleado.fecha_ingreso.slice(0, 10) : hoyISO(),
    fecha_nacimiento: empleado.fecha_nacimiento ? empleado.fecha_nacimiento.slice(0, 10) : '',
    direccion: empleado.direccion || '',
    cargo: empleado.cargo || '',
    sueldo_base: empleado.sueldo_base || '',
    email: empleado.email || '',
    telefono: empleado.telefono || '',
  };
}

function EmpleadoForm({ onSubmit, error, empleado, onCancelar }) {
  const esEdicion = Boolean(empleado);
  const [form, setForm] = useState(esEdicion ? valoresDesdeEmpleado(empleado) : valoresPorDefecto());

  useEffect(() => {
    setForm(esEdicion ? valoresDesdeEmpleado(empleado) : valoresPorDefecto());
  }, [empleado, esEdicion]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const ok = await onSubmit(form);
    if (ok && !esEdicion) setForm(valoresPorDefecto());
  }

  return (
    <form onSubmit={handleSubmit} className="form-grid" style={{ maxWidth: 420 }}>
      <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <label className="field">
          RUT
          <input
            name="rut"
            placeholder="12.345.678-5"
            value={form.rut}
            onChange={handleChange}
            required
            disabled={esEdicion}
            title={esEdicion ? 'El RUT no se puede modificar' : undefined}
          />
        </label>
        <label className="field">
          Fecha de nacimiento
          <input
            name="fecha_nacimiento"
            type="date"
            value={form.fecha_nacimiento}
            onChange={handleChange}
          />
        </label>
        <label className="field">
          Nombre
          <input name="nombre" value={form.nombre} onChange={handleChange} required />
        </label>
        <label className="field">
          Apellido
          <input name="apellido" value={form.apellido} onChange={handleChange} required />
        </label>
        <label className="field">
          Cargo
          <input name="cargo" value={form.cargo} onChange={handleChange} />
        </label>
        <label className="field">
          Sueldo base
          <input
            name="sueldo_base"
            type="number"
            value={form.sueldo_base}
            onChange={handleChange}
            required
          />
        </label>
        <label className="field">
          Email
          <input name="email" type="email" value={form.email} onChange={handleChange} />
        </label>
        <label className="field">
          Teléfono
          <input name="telefono" value={form.telefono} onChange={handleChange} />
        </label>
      </div>
      <label className="field">
        Dirección
        <input name="direccion" value={form.direccion} onChange={handleChange} />
      </label>
      {error && <p className="field-error">{error}</p>}
      <div className="form-actions">
        <button type="submit">{esEdicion ? 'Guardar cambios' : 'Registrar empleado'}</button>
        {esEdicion && (
          <button type="button" onClick={onCancelar}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

export default EmpleadoForm;
