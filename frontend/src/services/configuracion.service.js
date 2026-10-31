import api from './api';

export async function obtenerConfiguracion() {
  const { data } = await api.get('/configuracion');
  return data;
}

export async function actualizarConfiguracion(config) {
  const { data } = await api.put('/configuracion', config);
  return data;
}

export async function listarTramosImpuesto() {
  const { data } = await api.get('/configuracion/tramos-impuesto');
  return data;
}

export async function actualizarTramosImpuesto(tramos) {
  const { data } = await api.put('/configuracion/tramos-impuesto', { tramos });
  return data;
}
