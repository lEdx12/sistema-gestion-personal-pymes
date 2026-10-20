import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { listarEmpleados } from '../services/empleados.service';
import { listarAlertas } from '../services/alertas.service';
import { listarUsuarios } from '../services/usuarios.service';
import { IconUsers, IconBell, IconUserCog, IconFileText } from '../components/icons';

function DashboardAdministrador() {
  const [empleados, setEmpleados] = useState(null);
  const [alertas, setAlertas] = useState(null);
  const [totalUsuarios, setTotalUsuarios] = useState(null);

  useEffect(() => {
    listarEmpleados(true).then(setEmpleados).catch(() => setEmpleados([]));
    listarAlertas(true).then(setAlertas).catch(() => setAlertas([]));
    listarUsuarios(false).then((data) => setTotalUsuarios(data.length)).catch(() => setTotalUsuarios(null));
  }, []);

  const activos = empleados?.filter((e) => e.activo) ?? [];
  const inactivos = (empleados?.length ?? 0) - activos.length;

  return (
    <>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-top">
            Empleados activos
            <span className="stat-card-icon" style={{ background: 'var(--primary-bg)', color: 'var(--primary)' }}>
              <IconUsers />
            </span>
          </div>
          <div className="stat-card-value">{empleados === null ? '—' : activos.length}</div>
          <div className="stat-card-hint">{empleados === null ? 'Cargando...' : `${inactivos} inactivo(s)`}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            Alertas pendientes
            <span className="stat-card-icon" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>
              <IconBell />
            </span>
          </div>
          <div className="stat-card-value">{alertas === null ? '—' : alertas.length}</div>
          <div className="stat-card-hint">Contratos por vencer</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-top">
            Usuarios del sistema
            <span className="stat-card-icon" style={{ background: 'var(--accent-bg)', color: 'var(--accent)' }}>
              <IconUserCog />
            </span>
          </div>
          <div className="stat-card-value">{totalUsuarios ?? '—'}</div>
          <div className="stat-card-hint">Administradores y gerentes</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h2>
            Empleados
            <Link className="card-link" to="/empleados">
              Ver todos →
            </Link>
          </h2>
          {empleados === null && <p className="page-subtitle">Cargando...</p>}
          {empleados !== null && activos.length === 0 && (
            <div className="empty-state">Todavía no hay empleados activos registrados.</div>
          )}
          {activos.slice(0, 6).map((emp) => (
            <div className="list-item" key={emp.id}>
              <div className="list-item-main">
                <div className="list-item-title">
                  {emp.nombre} {emp.apellido}
                </div>
                <div className="list-item-meta">
                  {emp.rut} {emp.cargo ? `• ${emp.cargo}` : ''}
                </div>
              </div>
              <span className="status-badge ok">Activo</span>
            </div>
          ))}
        </div>

        <div className="card">
          <h2>
            Alertas pendientes
            <Link className="card-link" to="/alertas">
              Ver todas →
            </Link>
          </h2>
          {alertas === null && <p className="page-subtitle">Cargando...</p>}
          {alertas !== null && alertas.length === 0 && (
            <div className="empty-state">No hay alertas de vencimiento pendientes.</div>
          )}
          {alertas?.slice(0, 5).map((a) => (
            <div className="list-item" key={a.id}>
              <div className="list-item-main">
                <div className="list-item-title">
                  {a.empleado_nombre} {a.empleado_apellido}
                </div>
                <div className="list-item-meta">{a.mensaje}</div>
              </div>
              <span className="status-badge warn">{a.fecha_alerta?.slice(0, 10)}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function DashboardGerente() {
  return (
    <div className="dashboard-grid">
      <Link to="/reportes/asistencia" className="card" style={{ display: 'block' }}>
        <h2>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <IconFileText width={20} height={20} /> Reportes de asistencia
          </span>
        </h2>
        <p className="page-subtitle">
          Consulta el resumen mensual de asistencia por empleado o el consolidado de toda la
          empresa.
        </p>
        <span className="card-link">Ir a reportes →</span>
      </Link>

      <div className="card">
        <h2>Tu acceso</h2>
        <p className="page-subtitle">
          Como Gerente tienes acceso de solo lectura a reportes de asistencia, liquidaciones de
          sueldo e historial de remuneraciones. Para ver la liquidación de un empleado puntual,
          abre el enlace que te comparta el Administrador.
        </p>
      </div>
    </div>
  );
}

function Home() {
  const { usuario } = useAuth();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Hola, {usuario?.nombre?.split(' ')[0]}</h1>
          <p className="page-subtitle">Sistema de Gestión de Personal para PyMES</p>
        </div>
      </div>

      {usuario?.rol === 'administrador' ? <DashboardAdministrador /> : <DashboardGerente />}
    </div>
  );
}

export default Home;
