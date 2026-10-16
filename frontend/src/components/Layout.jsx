import { Link, Outlet } from 'react-router-dom';

function Layout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="app-title">
          Gestión de Personal
        </Link>
        <nav>
          <Link to="/empleados">Empleados</Link>
          <Link to="/reportes/asistencia">Reportes</Link>
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;
