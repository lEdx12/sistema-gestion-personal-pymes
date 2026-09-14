import api from './api';

export async function listarEmpleados(incluirInactivos = false) {
  const { data } = await api.get('/empleados', { params: { incluirInactivos } });
  return data;
}

export async function crearEmpleado(empleado) {
  const { data } = await api.post('/empleados', empleado);
  return data;
}

export async function desactivarEmpleado(id) {
  const { data } = await api.put(`/empleados/${id}/desactivar`);
  return data;
}

export async function reactivarEmpleado(id) {
  const { data } = await api.put(`/empleados/${id}/reactivar`);
  return data;
}
