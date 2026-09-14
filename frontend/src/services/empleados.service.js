import api from './api';

export async function listarEmpleados() {
  const { data } = await api.get('/empleados');
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
