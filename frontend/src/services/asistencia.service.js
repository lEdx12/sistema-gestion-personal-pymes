import api from './api';

export async function listarAsistencia(empleadoId) {
  const { data } = await api.get('/asistencia', { params: { empleado_id: empleadoId } });
  return data;
}

export async function marcarEntrada(datos) {
  const { data } = await api.post('/asistencia/entrada', datos);
  return data;
}

export async function marcarSalida(id, hora_salida) {
  const { data } = await api.put(`/asistencia/${id}/salida`, { hora_salida });
  return data;
}

export async function actualizarAsistencia(id, datos) {
  const { data } = await api.put(`/asistencia/${id}`, datos);
  return data;
}

export async function registrarAusencia(datos) {
  const { data } = await api.post('/asistencia/ausencia', datos);
  return data;
}

export async function obtenerResumenSemanal(empleadoId, desde, hasta) {
  const { data } = await api.get('/asistencia/resumen-semanal', {
    params: { empleado_id: empleadoId, desde, hasta },
  });
  return data;
}
