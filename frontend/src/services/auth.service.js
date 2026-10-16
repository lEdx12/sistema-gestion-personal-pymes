import api from './api';

export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
}

export async function logout() {
  try {
    await api.post('/auth/logout');
  } catch {
    // El logout es una cortesía del lado del servidor; si falla igual limpiamos la
    // sesión localmente (ver AuthContext).
  }
}
