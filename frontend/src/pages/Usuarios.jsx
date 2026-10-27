import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/useAuth';
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

// Evita caracteres que se confunden al leerlos/tipearlos (0/O, 1/l/I).
const ALFABETO_PASSWORD_TEMPORAL = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

function generarPasswordTemporal() {
  let resultado = '';
  for (let i = 0; i < 10; i++) {
    resultado += ALFABETO_PASSWORD_TEMPORAL[Math.floor(Math.random() * ALFABETO_PASSWORD_TEMPORAL.length)];
  }
  return resultado;
}

function Usuarios() {
  const { usuario: usuarioActual } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState(null);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [passwordGenerada, setPasswordGenerada] = useState(null); // { id, password }
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

  async function handleRestablecerPassword(usuario) {
    const confirmado = window.confirm(
      `¿Restablecer la contraseña de ${usuario.nombre}? Se generará una contraseña temporal y deberá cambiarla en su próximo inicio de sesión.`,
    );
    if (!confirmado) return;

    setErrorPassword(null);
    const temporal = generarPasswordTemporal();
    try {
      await cambiarPasswordUsuario(usuario.id, temporal);
      setPasswordGenerada({ id: usuario.id, password: temporal });
      await cargar();
    } catch (err) {
      setErrorPassword(err.response?.data?.error || 'Error al restablecer la contraseña');
    }
  }

  async function handleCopiarPassword(password) {
    try {
      await navigator.clipboard.writeText(password);
    } catch {
      // Si el portapapeles no está disponible, la contraseña igual queda visible para copiarla a mano.
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

      {errorPassword && <p className="field-error">{errorPassword}</p>}

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
              <th>Contraseña</th>
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
                {u.debe_cambiar_password ? (
                  <span className="status-badge warn" title="Todavía no inicia sesión con una contraseña propia">
                    Pendiente
                  </span>
                ) : (
                  <span className="status-badge muted">Definida</span>
                )}
              </td>
              <td>
                <div className="row-actions">
                  <button type="button" className="btn-icon" onClick={() => handleEditar(u)} title="Editar">
                    <IconEdit />
                  </button>
                  {u.id !== usuarioActual?.id && (
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => handleRestablecerPassword(u)}
                      title="Restablecer contraseña"
                    >
                      <IconKey />
                    </button>
                  )}
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
                {passwordGenerada?.id === u.id && (
                  <div
                    className="card"
                    style={{
                      display: 'flex',
                      gap: '0.6rem',
                      alignItems: 'center',
                      marginTop: '0.5rem',
                      padding: '0.5rem 0.75rem',
                    }}
                  >
                    <div style={{ fontSize: '0.85em' }}>
                      Contraseña temporal: <strong>{passwordGenerada.password}</strong>
                      <br />
                      <span className="page-subtitle" style={{ margin: 0 }}>
                        Compártela con {u.nombre}; no se volverá a mostrar.
                      </span>
                    </div>
                    <button type="button" onClick={() => handleCopiarPassword(passwordGenerada.password)}>
                      Copiar
                    </button>
                    <button type="button" className="btn-ghost" onClick={() => setPasswordGenerada(null)}>
                      Cerrar
                    </button>
                  </div>
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
