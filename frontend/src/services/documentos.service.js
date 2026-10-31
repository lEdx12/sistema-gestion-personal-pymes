import api from './api';

export async function listarDocumentos(empleadoId, { tipo, pagina, porPagina } = {}) {
  const { data } = await api.get('/documentos', {
    params: { empleado_id: empleadoId, tipo: tipo || undefined, pagina, por_pagina: porPagina },
  });
  return data;
}

export async function subirDocumento(empleadoId, archivo, tipo) {
  const formData = new FormData();
  formData.append('empleado_id', empleadoId);
  formData.append('documento', archivo);
  if (tipo) formData.append('tipo', tipo);
  const { data } = await api.post('/documentos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function eliminarDocumento(id) {
  await api.delete(`/documentos/${id}`);
}
