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
