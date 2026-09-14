import api from './api';

export async function listarContratos(empleadoId) {
  const { data } = await api.get('/contratos', { params: { empleado_id: empleadoId } });
  return data;
}

export async function crearContrato(contrato) {
  const { data } = await api.post('/contratos', contrato);
  return data;
}

export async function renovarContrato(id, contrato) {
  const { data } = await api.put(`/contratos/${id}/renovar`, contrato);
  return data;
}

export async function subirDocumentoContrato(id, archivo) {
  const formData = new FormData();
  formData.append('documento', archivo);
  const { data } = await api.post(`/contratos/${id}/documento`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
