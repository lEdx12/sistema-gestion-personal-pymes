import api from './api';

export async function listarAlertas(soloNoLeidas = false) {
  const { data } = await api.get('/alertas', { params: { soloNoLeidas } });
  return data;
}

export async function marcarAlertaLeida(id) {
  const { data } = await api.put(`/alertas/${id}/leida`);
  return data;
}

export async function generarAlertas() {
  const { data } = await api.post('/alertas/generar');
  return data;
}
