import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EmpleadoForm from '../components/EmpleadoForm';
import {
  listarEmpleados,
  crearEmpleado,
  desactivarEmpleado,
  reactivarEmpleado,
} from '../services/empleados.service';

function Empleados() {
  const [empleados, setEmpleados] = useState([]);
  const [error, setError] = useState(null);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);

  const cargar = useCallback(async () => {
    const data = await listarEmpleados(mostrarInactivos);
    setEmpleados(data);
  }, [mostrarInactivos]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function handleCrear(form) {
    setError(null);
    try {
      await crearEmpleado({ ...form, sueldo_base: Number(form.sueldo_base) });
      await cargar();
      return true;
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar el empleado');
      return false;
    }
  }

  async function handleDesactivar(id) {
    await desactivarEmpleado(id);
    await cargar();
  }

  async function handleReactivar(id) {
    await reactivarEmpleado(id);
    await cargar();
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Empleados</h1>

      <EmpleadoForm onSubmit={handleCrear} error={error} />

      <label style={{ display: 'block', marginTop: '1rem' }}>
        <input
          type="checkbox"
          checked={mostrarInactivos}
          onChange={(e) => setMostrarInactivos(e.target.checked)}
        />{' '}
        Mostrar empleados inactivos
      </label>

      <table style={{ marginTop: '1rem', borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>RUT</th>
            <th>Nombre</th>
            <th>Cargo</th>
            <th>Sueldo base</th>
            <th>Estado</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {empleados.map((emp) => (
            <tr key={emp.id}>
              <td>{emp.rut}</td>
              <td>
                {emp.nombre} {emp.apellido}
              </td>
              <td>{emp.cargo}</td>
              <td>{emp.sueldo_base}</td>
              <td>{emp.activo ? 'Activo' : 'Inactivo'}</td>
              <td>
                <Link to={`/empleados/${emp.id}/contratos`}>Contratos</Link>{' '}
                <Link to={`/empleados/${emp.id}/asistencia`}>Asistencia</Link>{' '}
                {emp.activo ? (
                  <button type="button" onClick={() => handleDesactivar(emp.id)}>
                    Desactivar
                  </button>
                ) : (
                  <button type="button" onClick={() => handleReactivar(emp.id)}>
                    Reactivar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Empleados;
