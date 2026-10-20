import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EmpleadoForm from '../components/EmpleadoForm';
import {
  listarEmpleados,
  crearEmpleado,
  actualizarEmpleado,
  desactivarEmpleado,
  reactivarEmpleado,
} from '../services/empleados.service';

function formatearMonto(valor) {
  return Number(valor).toLocaleString('es-CL');
}

function Empleados() {
  const [empleados, setEmpleados] = useState([]);
  const [error, setError] = useState(null);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [empleadoEditando, setEmpleadoEditando] = useState(null);

  const cargar = useCallback(async () => {
    const data = await listarEmpleados(mostrarInactivos);
    setEmpleados(data);
  }, [mostrarInactivos]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function handleGuardar(form) {
    setError(null);
    const payload = { ...form, sueldo_base: Number(form.sueldo_base) };
    try {
      if (empleadoEditando) {
        await actualizarEmpleado(empleadoEditando.id, payload);
        setEmpleadoEditando(null);
      } else {
        await crearEmpleado(payload);
      }
      await cargar();
      return true;
    } catch (err) {
      setError(
        err.response?.data?.error ||
          (empleadoEditando ? 'Error al actualizar el empleado' : 'Error al registrar el empleado'),
      );
      return false;
    }
  }

  function handleEditar(emp) {
    setError(null);
    setEmpleadoEditando(emp);
  }

  function handleCancelarEdicion() {
    setError(null);
    setEmpleadoEditando(null);
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
    <div>
      <div className="page-header">
        <div>
          <h1>Empleados</h1>
          <p className="page-subtitle">Ficha, contratos, asistencia y documentos de cada trabajador.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2>{empleadoEditando ? `Editar empleado: ${empleadoEditando.rut}` : 'Registrar empleado'}</h2>
        <EmpleadoForm
          onSubmit={handleGuardar}
          error={error}
          empleado={empleadoEditando}
          onCancelar={handleCancelarEdicion}
        />
      </div>

      <div className="table-wrap">
        <div className="table-toolbar">
          <h2 style={{ margin: 0 }}>{empleados.length} empleado(s)</h2>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={mostrarInactivos}
              onChange={(e) => setMostrarInactivos(e.target.checked)}
            />
            Mostrar empleados inactivos
          </label>
        </div>

        {empleados.length === 0 ? (
          <div className="empty-state">No hay empleados para mostrar.</div>
        ) : (
          <table>
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
                  <td>${formatearMonto(emp.sueldo_base)}</td>
                  <td>
                    <span className={`status-badge ${emp.activo ? 'ok' : 'off'}`}>
                      {emp.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <button type="button" onClick={() => handleEditar(emp)}>
                      Editar
                    </button>{' '}
                    <Link to={`/empleados/${emp.id}/contratos`}>Contratos</Link>{' '}
                    <Link to={`/empleados/${emp.id}/asistencia`}>Asistencia</Link>{' '}
                    <Link to={`/empleados/${emp.id}/liquidaciones`}>Liquidaciones</Link>{' '}
                    <Link to={`/empleados/${emp.id}/documentos`}>Documentos</Link>{' '}
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
        )}
      </div>
    </div>
  );
}

export default Empleados;
