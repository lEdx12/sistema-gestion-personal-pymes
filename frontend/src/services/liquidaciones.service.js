import api from './api';
import { slugificar } from '../utils/texto';

export async function listarLiquidaciones(empleadoId) {
  const { data } = await api.get('/liquidaciones', { params: { empleado_id: empleadoId } });
  return data;
}

export async function generarLiquidacion(empleadoId, periodo) {
  const { data } = await api.post('/liquidaciones', { empleado_id: empleadoId, periodo });
  return data;
}

export async function obtenerHistorialRemuneraciones(empleadoId, desde, hasta, pagina, porPagina) {
  const { data } = await api.get('/liquidaciones/historial', {
    params: {
      empleado_id: empleadoId,
      desde: desde || undefined,
      hasta: hasta || undefined,
      pagina,
      por_pagina: porPagina,
    },
  });
  return data;
}

export async function descargarLiquidacionPdf(liquidacionId, periodo, nombreEmpleado) {
  const { data } = await api.get(`/liquidaciones/${liquidacionId}/pdf`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(data);
  const enlace = document.createElement('a');
  enlace.href = url;
  const sufijoNombre = nombreEmpleado ? `-${slugificar(nombreEmpleado)}` : '';
  enlace.download = `liquidacion-${periodo}${sufijoNombre}.pdf`;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  window.URL.revokeObjectURL(url);
}
