import api from './api';

export async function listarLiquidaciones(empleadoId) {
  const { data } = await api.get('/liquidaciones', { params: { empleado_id: empleadoId } });
  return data;
}

export async function generarLiquidacion(empleadoId, periodo) {
  const { data } = await api.post('/liquidaciones', { empleado_id: empleadoId, periodo });
  return data;
}

export async function obtenerHistorialRemuneraciones(empleadoId, desde, hasta) {
  const { data } = await api.get('/liquidaciones/historial', {
    params: { empleado_id: empleadoId, desde: desde || undefined, hasta: hasta || undefined },
  });
  return data;
}

export async function descargarLiquidacionPdf(liquidacionId, periodo) {
  const { data } = await api.get(`/liquidaciones/${liquidacionId}/pdf`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(data);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `liquidacion-${periodo}.pdf`;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  window.URL.revokeObjectURL(url);
}
