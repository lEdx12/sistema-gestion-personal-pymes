import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import {
  IconHome,
  IconUsers,
  IconFileText,
  IconBell,
  IconUserCog,
  IconSettings,
  IconLogout,
} from './icons';

function iniciales(nombre) {
  if (!nombre) return '?';
  return nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

function enlaceClase({ isActive }) {
  return `sidebar-link${isActive ? ' active' : ''}`;
}

function Layout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const esAdministrador = usuario?.rol === 'administrador';

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <NavLink to="/" className="sidebar-brand">
          <span className="sidebar-brand-mark">GP</span>
          <span className="label-text">Gestión de Personal</span>
        </NavLink>

        <nav className="sidebar-nav">
          <NavLink to="/" end className={enlaceClase}>
            <span className="sidebar-link-icon">
              <IconHome />
            </span>
            <span className="label-text">Inicio</span>
          </NavLink>
          {esAdministrador && (
            <NavLink to="/empleados" className={enlaceClase}>
              <span className="sidebar-link-icon">
                <IconUsers />
              </span>
              <span className="label-text">Empleados</span>
            </NavLink>
          )}
          <NavLink to="/reportes/asistencia" className={enlaceClase}>
            <span className="sidebar-link-icon">
              <IconFileText />
            </span>
            <span className="label-text">Reportes</span>
          </NavLink>
          {esAdministrador && (
            <NavLink to="/alertas" className={enlaceClase}>
              <span className="sidebar-link-icon">
                <IconBell />
              </span>
              <span className="label-text">Alertas</span>
            </NavLink>
          )}
          {esAdministrador && (
            <NavLink to="/usuarios" className={enlaceClase}>
              <span className="sidebar-link-icon">
                <IconUserCog />
              </span>
              <span className="label-text">Usuarios</span>
            </NavLink>
          )}
          {esAdministrador && (
            <NavLink to="/configuracion" className={enlaceClase}>
              <span className="sidebar-link-icon">
                <IconSettings />
              </span>
              <span className="label-text">Configuración</span>
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <span className="avatar">{iniciales(usuario?.nombre)}</span>
          <div className="user-info">
            <strong>{usuario?.nombre}</strong>
            <span>{usuario?.rol}</span>
          </div>
          <button
            type="button"
            className="logout-btn"
            onClick={handleLogout}
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
          >
            <IconLogout width={18} height={18} />
          </button>
        </div>
      </aside>

      <div className="app-main">
        <div className="app-main-inner">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default Layout;
