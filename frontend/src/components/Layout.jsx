import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Layout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="app-title">
          Gestión de Personal
        </Link>
        <nav style={{ display: 'flex', alignItems: 'center' }}>
          <Link to="/empleados">Empleados</Link>
          <Link to="/reportes/asistencia">Reportes</Link>
          {usuario && (
            <span style={{ marginLeft: '1.25rem', fontSize: '0.85em', color: 'var(--text-muted)' }}>
              {usuario.nombre}
            </span>
          )}
          <button type="button" onClick={handleLogout} style={{ marginLeft: '0.75rem' }}>
            Cerrar sesión
          </button>
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
