import api from './api';

export async function listarAlertas({ soloNoLeidas = false, pagina, porPagina } = {}) {
  const { data } = await api.get('/alertas', {
    params: { soloNoLeidas, pagina, por_pagina: porPagina },
  });
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
