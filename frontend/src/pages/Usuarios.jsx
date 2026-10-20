import { useCallback, useEffect, useState } from 'react';
import UsuarioForm from '../components/UsuarioForm';
import { IconEdit, IconKey, IconPower } from '../components/icons';
import {
  listarUsuarios,
  crearUsuario,
  actualizarUsuario,
  cambiarPasswordUsuario,
  desactivarUsuario,
  reactivarUsuario,
} from '../services/usuarios.service';

function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState(null);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [cambiandoPasswordId, setCambiandoPasswordId] = useState(null);
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [errorPassword, setErrorPassword] = useState(null);

  const cargar = useCallback(async () => {
    const data = await listarUsuarios(mostrarInactivos);
    setUsuarios(data);
  }, [mostrarInactivos]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function handleGuardar(form) {
    setError(null);
    try {
      if (usuarioEditando) {
        await actualizarUsuario(usuarioEditando.id, form);
        setUsuarioEditando(null);
      } else {
        await crearUsuario(form);
      }
      await cargar();
      return true;
    } catch (err) {
      setError(
        err.response?.data?.error ||
          (usuarioEditando ? 'Error al actualizar el usuario' : 'Error al crear el usuario'),
      );
      return false;
    }
  }

  function handleEditar(usuario) {
    setError(null);
    setUsuarioEditando(usuario);
  }

  function handleCancelarEdicion() {
    setError(null);
    setUsuarioEditando(null);
  }

  async function handleDesactivar(id) {
    await desactivarUsuario(id);
    await cargar();
  }

  async function handleReactivar(id) {
    await reactivarUsuario(id);
    await cargar();
  }

  function handleAbrirCambioPassword(id) {
    setErrorPassword(null);
    setNuevaPassword('');
    setCambiandoPasswordId(id);
  }

  async function handleGuardarPassword(e) {
    e.preventDefault();
    setErrorPassword(null);
    try {
      await cambiarPasswordUsuario(cambiandoPasswordId, nuevaPassword);
      setCambiandoPasswordId(null);
      setNuevaPassword('');
    } catch (err) {
      setErrorPassword(err.response?.data?.error || 'Error al cambiar la contraseña');
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Usuarios del sistema</h1>
          <p className="page-subtitle">Cuentas de acceso y roles (Administrador / Gerente).</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem', maxWidth: 400 }}>
        <h2>{usuarioEditando ? `Editar usuario: ${usuarioEditando.email}` : 'Crear usuario'}</h2>
        <UsuarioForm
          onSubmit={handleGuardar}
          error={error}
          usuario={usuarioEditando}
          onCancelar={handleCancelarEdicion}
        />
      </div>

      <div className="table-wrap">
        <div className="table-toolbar">
          <h2 style={{ margin: 0 }}>{usuarios.length} usuario(s)</h2>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={mostrarInactivos}
              onChange={(e) => setMostrarInactivos(e.target.checked)}
            />
            Mostrar usuarios inactivos
          </label>
        </div>

        {usuarios.length === 0 ? (
          <div className="empty-state">No hay usuarios para mostrar.</div>
        ) : (
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
            <tr key={u.id}>
              <td>{u.nombre}</td>
              <td>{u.email}</td>
              <td>
                <span className="status-badge muted">{u.rol}</span>
              </td>
              <td>
                <span className={`status-badge ${u.activo ? 'ok' : 'off'}`}>
                  {u.activo ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td>
                <div className="row-actions">
                  <button type="button" className="btn-icon" onClick={() => handleEditar(u)} title="Editar">
                    <IconEdit />
                  </button>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => handleAbrirCambioPassword(u.id)}
                    title="Cambiar contraseña"
                  >
                    <IconKey />
                  </button>
                  {u.activo ? (
                    <button
                      type="button"
                      className="btn-icon btn-danger"
                      onClick={() => handleDesactivar(u.id)}
                      title="Desactivar"
                    >
                      <IconPower />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => handleReactivar(u.id)}
                      title="Reactivar"
                    >
                      <IconPower />
                    </button>
                  )}
                </div>
                {cambiandoPasswordId === u.id && (
                  <form
                    onSubmit={handleGuardarPassword}
                    style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem', alignItems: 'center' }}
                  >
                    <input
                      type="password"
                      placeholder="Nueva contraseña"
                      value={nuevaPassword}
                      onChange={(e) => setNuevaPassword(e.target.value)}
                      minLength={8}
                      required
                      style={{ maxWidth: 160 }}
                    />
                    <button type="submit">Guardar</button>
                    <button type="button" className="btn-ghost" onClick={() => setCambiandoPasswordId(null)}>
                      Cancelar
                    </button>
                    {errorPassword && <span className="field-error" style={{ fontSize: '0.85em' }}>{errorPassword}</span>}
                  </form>
                )}
              </td>
            </tr>
          ))}
          </tbody>
        </table>
        )}
      </div>
    </div>
  );
}

export default Usuarios;
