import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { cambiarMiPassword } from '../services/usuarios.service';

function CambiarPasswordObligatorio() {
  const { usuario, logout, marcarPasswordCambiada } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (password !== confirmacion) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setCargando(true);
    try {
      await cambiarMiPassword(password);
      marcarPasswordCambiada();
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar la contraseña');
    } finally {
      setCargando(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="login-shell">
      <form onSubmit={handleSubmit} className="card login-card">
        <div className="login-brand">
          <span className="sidebar-brand-mark">GP</span>
          <div>
            <h1>Actualiza tu contraseña</h1>
            <p className="page-subtitle" style={{ margin: 0 }}>
              Es tu primer inicio de sesión{usuario?.nombre ? `, ${usuario.nombre}` : ''}. Define una
              contraseña propia para continuar.
            </p>
          </div>
        </div>
        <div className="form-grid">
          <label className="field">
            Nueva contraseña
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
              autoFocus
            />
          </label>
          <label className="field">
            Confirmar contraseña
            <input
              type="password"
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>
          {error && <p className="field-error">{error}</p>}
          <button type="submit" disabled={cargando}>
            {cargando ? 'Guardando…' : 'Cambiar contraseña y continuar'}
          </button>
          <button type="button" className="btn-ghost" onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </form>
    </div>
  );
}

export default CambiarPasswordObligatorio;
