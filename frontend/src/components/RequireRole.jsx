import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

/** RF-02: oculta en el frontend las rutas que el backend ya rechaza para ese rol. */
function RequireRole({ roles }) {
  const { usuario } = useAuth();

  if (!roles.includes(usuario?.rol)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default RequireRole;
