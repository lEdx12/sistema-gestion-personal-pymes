import { Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout';
import RequireAuth from '../components/RequireAuth';
import RequireRole from '../components/RequireRole';
import Login from '../pages/Login';
import CambiarPasswordObligatorio from '../pages/CambiarPasswordObligatorio';
import Home from '../pages/Home';
import Empleados from '../pages/Empleados';
import Contratos from '../pages/Contratos';
import Asistencia from '../pages/Asistencia';
import Liquidaciones from '../pages/Liquidaciones';
import ReporteAsistencia from '../pages/ReporteAsistencia';
import Usuarios from '../pages/Usuarios';
import Alertas from '../pages/Alertas';
import Documentos from '../pages/Documentos';
import Configuracion from '../pages/Configuracion';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAuth />}>
        <Route path="/cambiar-password" element={<CambiarPasswordObligatorio />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          {/* RF-02: empleados/contratos/asistencia no son los "reportes, liquidaciones
              e historial" de solo lectura del Gerente (sección 3 de PROJECT.md) — el
              backend ya los rechaza para ese rol y aquí se ocultan del lado cliente. */}
          <Route element={<RequireRole roles={['administrador']} />}>
            <Route path="/empleados" element={<Empleados />} />
            <Route path="/empleados/:empleadoId/contratos" element={<Contratos />} />
            <Route path="/empleados/:empleadoId/asistencia" element={<Asistencia />} />
            <Route path="/empleados/:empleadoId/documentos" element={<Documentos />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/alertas" element={<Alertas />} />
            <Route path="/configuracion" element={<Configuracion />} />
          </Route>
          <Route path="/empleados/:empleadoId/liquidaciones" element={<Liquidaciones />} />
          <Route path="/reportes/asistencia" element={<ReporteAsistencia />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default AppRoutes;
