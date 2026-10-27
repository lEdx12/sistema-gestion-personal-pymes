import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

function RequireAuth() {
  const { token, usuario } = useAuth();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Primer login (o contraseña recién restablecida por un Administrador): no deja
  // pasar a ninguna otra pantalla hasta definir una contraseña propia.
  if (usuario?.debe_cambiar_password && location.pathname !== '/cambiar-password') {
    return <Navigate to="/cambiar-password" replace />;
  }

  return <Outlet />;
}

export default RequireAuth;
