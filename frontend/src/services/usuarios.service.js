import api from './api';

export async function listarUsuarios(incluirInactivos = false) {
  const { data } = await api.get('/usuarios', { params: { incluirInactivos } });
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

export async function desactivarUsuario(id) {
  const { data } = await api.put(`/usuarios/${id}/desactivar`);
  return data;
}

export async function reactivarUsuario(id) {
  const { data } = await api.put(`/usuarios/${id}/reactivar`);
  return data;
}
