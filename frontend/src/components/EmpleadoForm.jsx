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

const estiloCampo = { display: 'flex', flexDirection: 'column', fontSize: '0.85em', gap: '0.15rem' };

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
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.5rem', maxWidth: 400 }}>
      <label style={estiloCampo}>
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
      <label style={estiloCampo}>
        Nombre
        <input name="nombre" value={form.nombre} onChange={handleChange} required />
      </label>
      <label style={estiloCampo}>
        Apellido
        <input name="apellido" value={form.apellido} onChange={handleChange} required />
      </label>
      <label style={estiloCampo}>
        Fecha de nacimiento
        <input
          name="fecha_nacimiento"
          type="date"
          value={form.fecha_nacimiento}
          onChange={handleChange}
        />
      </label>
      <label style={estiloCampo}>
        Dirección
        <input name="direccion" value={form.direccion} onChange={handleChange} />
      </label>
      <label style={estiloCampo}>
        Cargo
        <input name="cargo" value={form.cargo} onChange={handleChange} />
      </label>
      <label style={estiloCampo}>
        Sueldo base
        <input
          name="sueldo_base"
          type="number"
          value={form.sueldo_base}
          onChange={handleChange}
          required
        />
      </label>
      <label style={estiloCampo}>
        Email
        <input name="email" type="email" value={form.email} onChange={handleChange} />
      </label>
      <label style={estiloCampo}>
        Teléfono
        <input name="telefono" value={form.telefono} onChange={handleChange} />
      </label>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
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
