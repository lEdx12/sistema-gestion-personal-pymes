import api from './api';

export async function listarLiquidaciones(empleadoId) {
  const { data } = await api.get('/liquidaciones', { params: { empleado_id: empleadoId } });
  return data;
}

export async function generarLiquidacion(empleadoId, periodo) {
  const { data } = await api.post('/liquidaciones', { empleado_id: empleadoId, periodo });
  return data;
}
