import api from './api';
import { slugificar } from '../utils/texto';

export async function obtenerReporteMensual({ empleadoId, periodo }) {
  const { data } = await api.get('/asistencia/reporte-mensual', {
    params: { empleado_id: empleadoId || undefined, periodo },
  });
  return data;
}

export async function descargarReporteMensualPdf({ empleadoId, periodo, nombreEmpleado }) {
  const { data } = await api.get('/asistencia/reporte-mensual/pdf', {
    params: { empleado_id: empleadoId || undefined, periodo },
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(data);
  const enlace = document.createElement('a');
  enlace.href = url;
  const sufijo = empleadoId && nombreEmpleado ? `-${slugificar(nombreEmpleado)}` : '-consolidado';
  enlace.download = `reporte-asistencia-${periodo}${sufijo}.pdf`;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  window.URL.revokeObjectURL(url);
}
