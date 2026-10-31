import { useEffect, useState } from 'react';

function valoresPorDefecto() {
  return { nombre: '', email: '', password: '', rol: 'gerente' };
}

function valoresDesdeUsuario(usuario) {
  return { nombre: usuario.nombre || '', email: usuario.email || '', password: '', rol: usuario.rol };
}

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
    <form onSubmit={handleSubmit} className="form-grid">
      <div className="form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <label className="field">
          Nombre
          <input name="nombre" value={form.nombre} onChange={handleChange} required />
        </label>
        <label className="field">
          Email
          <input name="email" type="email" value={form.email} onChange={handleChange} required />
        </label>
        {!esEdicion && (
          <label className="field">
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
        <label className="field">
          Rol
          <select name="rol" value={form.rol} onChange={handleChange}>
            <option value="administrador">Administrador</option>
            <option value="gerente">Gerente</option>
          </select>
        </label>
      </div>
      {error && <p className="field-error">{error}</p>}
      <div className="form-actions">
        <button type="submit">{esEdicion ? 'Guardar cambios' : 'Crear usuario'}</button>
        {esEdicion && (
          <button type="button" className="btn-ghost" onClick={onCancelar}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

export default UsuarioForm;
