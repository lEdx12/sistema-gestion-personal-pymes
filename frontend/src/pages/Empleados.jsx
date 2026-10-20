import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EmpleadoForm from '../components/EmpleadoForm';
import { IconEdit, IconFileText, IconClock, IconCash, IconFolder, IconPower } from '../components/icons';
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
                  <td className="num">${formatearMonto(emp.sueldo_base)}</td>
                  <td>
                    <span className={`status-badge ${emp.activo ? 'ok' : 'off'}`}>
                      {emp.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => handleEditar(emp)}
                        title="Editar"
                      >
                        <IconEdit />
                      </button>
                      <Link className="btn-icon" to={`/empleados/${emp.id}/contratos`} title="Contratos">
                        <IconFileText />
                      </Link>
                      <Link className="btn-icon" to={`/empleados/${emp.id}/asistencia`} title="Asistencia">
                        <IconClock />
                      </Link>
                      <Link className="btn-icon" to={`/empleados/${emp.id}/liquidaciones`} title="Liquidaciones">
                        <IconCash />
                      </Link>
                      <Link className="btn-icon" to={`/empleados/${emp.id}/documentos`} title="Documentos">
                        <IconFolder />
                      </Link>
                      {emp.activo ? (
                        <button
                          type="button"
                          className="btn-icon btn-danger"
                          onClick={() => handleDesactivar(emp.id)}
                          title="Desactivar"
                        >
                          <IconPower />
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => handleReactivar(emp.id)}
                          title="Reactivar"
                        >
                          <IconPower />
                        </button>
                      )}
                    </div>
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
