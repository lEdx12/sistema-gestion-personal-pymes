import { useState, useCallback } from 'react';
import { login as loginRequest, logout as logoutRequest } from '../services/auth.service';
import { AuthContext } from './authContextInstance';

// El objeto de contexto y el hook useAuth() viven en archivos separados a propósito:
// React Fast Refresh (HMR) no logra mantener la identidad del contexto cuando un mismo
// archivo exporta algo que no es (solo) un componente — eso provocaba "useAuth debe
// usarse dentro de <AuthProvider>" al guardar cambios durante el desarrollo.

function leerUsuarioGuardado() {
  try {
    const crudo = localStorage.getItem('usuario');
    return crudo ? JSON.parse(crudo) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [usuario, setUsuario] = useState(leerUsuarioGuardado);

  const login = useCallback(async (email, password) => {
    const data = await loginRequest(email, password);
    localStorage.setItem('token', data.token);
    localStorage.setItem('usuario', JSON.stringify(data.usuario));
    setToken(data.token);
    setUsuario(data.usuario);
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setToken(null);
    setUsuario(null);
  }, []);

  /** Tras el cambio de contraseña obligatorio del primer login: ya no hace falta volver a loguear. */
  const marcarPasswordCambiada = useCallback(() => {
    setUsuario((actual) => {
      if (!actual) return actual;
      const actualizado = { ...actual, debe_cambiar_password: false };
      localStorage.setItem('usuario', JSON.stringify(actualizado));
      return actualizado;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ token, usuario, login, logout, marcarPasswordCambiada }}>
      {children}
    </AuthContext.Provider>
  );
}
