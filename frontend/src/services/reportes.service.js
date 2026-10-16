import api from './api';

export async function obtenerReporteMensual({ empleadoId, periodo }) {
  const { data } = await api.get('/asistencia/reporte-mensual', {
    params: { empleado_id: empleadoId || undefined, periodo },
  });
  return data;
}
