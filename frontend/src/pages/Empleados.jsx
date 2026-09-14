import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EmpleadoForm from '../components/EmpleadoForm';
import { listarEmpleados, crearEmpleado, desactivarEmpleado } from '../services/empleados.service';

function Empleados() {
  const [empleados, setEmpleados] = useState([]);
  const [error, setError] = useState(null);

  async function cargar() {
    const data = await listarEmpleados();
    setEmpleados(data);
  }

  useEffect(() => {
    cargar();
  }, []);

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

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Empleados</h1>

      <EmpleadoForm onSubmit={handleCrear} error={error} />

      <table style={{ marginTop: '2rem', borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>RUT</th>
            <th>Nombre</th>
            <th>Cargo</th>
            <th>Sueldo base</th>
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
              <td>
                <Link to={`/empleados/${emp.id}/contratos`}>Contratos</Link>{' '}
                <button type="button" onClick={() => handleDesactivar(emp.id)}>
                  Desactivar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Empleados;
