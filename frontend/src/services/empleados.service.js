import api from './api';

export async function listarEmpleados(incluirInactivos = false) {
  const { data } = await api.get('/empleados', { params: { incluirInactivos } });
  return data;
}

/** Versión acotada (id/rut/nombre/apellido) accesible también para el Gerente, para elegir a quién ver el reporte. */
export async function listarEmpleadosSelector() {
  const { data } = await api.get('/empleados/selector');
  return data;
}

export async function crearEmpleado(empleado) {
  const { data } = await api.post('/empleados', empleado);
  return data;
}

export async function actualizarEmpleado(id, empleado) {
  const { data } = await api.put(`/empleados/${id}`, empleado);
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
