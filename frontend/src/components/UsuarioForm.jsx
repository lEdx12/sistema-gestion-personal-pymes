import { useEffect, useState } from 'react';

function valoresPorDefecto() {
  return { nombre: '', email: '', password: '', rol: 'gerente' };
}

function valoresDesdeUsuario(usuario) {
  return { nombre: usuario.nombre || '', email: usuario.email || '', password: '', rol: usuario.rol };
}

const estiloCampo = { display: 'flex', flexDirection: 'column', fontSize: '0.85em', gap: '0.15rem' };

function UsuarioForm({ onSubmit, error, usuario, onCancelar }) {
  const esEdicion = Boolean(usuario);
  const [form, setForm] = useState(esEdicion ? valoresDesdeUsuario(usuario) : valoresPorDefecto());

  useEffect(() => {
    setForm(esEdicion ? valoresDesdeUsuario(usuario) : valoresPorDefecto());
  }, [usuario, esEdicion]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const ok = await onSubmit(form);
    if (ok && !esEdicion) setForm(valoresPorDefecto());
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.5rem', maxWidth: 360 }}>
      <label style={estiloCampo}>
        Nombre
        <input name="nombre" value={form.nombre} onChange={handleChange} required />
      </label>
      <label style={estiloCampo}>
        Email
        <input name="email" type="email" value={form.email} onChange={handleChange} required />
      </label>
      {!esEdicion && (
        <label style={estiloCampo}>
          Contraseña
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            minLength={8}
            required
          />
        </label>
      )}
      <label style={estiloCampo}>
        Rol
        <select name="rol" value={form.rol} onChange={handleChange}>
          <option value="administrador">Administrador</option>
          <option value="gerente">Gerente</option>
        </select>
      </label>
      {error && <p className="field-error">{error}</p>}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button type="submit">{esEdicion ? 'Guardar cambios' : 'Crear usuario'}</button>
        {esEdicion && (
          <button type="button" onClick={onCancelar}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

export default UsuarioForm;
