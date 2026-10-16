import { createContext, useContext, useState, useCallback } from 'react';
import { login as loginRequest, logout as logoutRequest } from '../services/auth.service';

const AuthContext = createContext(null);

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

  return (
    <AuthContext.Provider value={{ token, usuario, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return contexto;
}
