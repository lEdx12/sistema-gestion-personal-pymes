import api from './api';

export async function listarUsuarios({ incluirInactivos = false, texto, rol, pagina, porPagina } = {}) {
  const { data } = await api.get('/usuarios', {
    params: { incluirInactivos, texto: texto || undefined, rol: rol || undefined, pagina, por_pagina: porPagina },
  });
  return data;
}

export async function crearUsuario(usuario) {
  const { data } = await api.post('/usuarios', usuario);
  return data;
}

export async function actualizarUsuario(id, usuario) {
  const { data } = await api.put(`/usuarios/${id}`, usuario);
  return data;
}

export async function cambiarPasswordUsuario(id, password) {
  await api.put(`/usuarios/${id}/password`, { password });
}

/** Self-service: el usuario autenticado cambia su propia contraseña. */
export async function cambiarMiPassword(password) {
  await api.put('/usuarios/me/password', { password });
}

export async function desactivarUsuario(id) {
  const { data } = await api.put(`/usuarios/${id}/desactivar`);
  return data;
}

export async function reactivarUsuario(id) {
  const { data } = await api.put(`/usuarios/${id}/reactivar`);
  return data;
}
