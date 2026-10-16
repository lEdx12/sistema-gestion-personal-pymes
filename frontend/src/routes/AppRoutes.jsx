import { Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout';
import RequireAuth from '../components/RequireAuth';
import Login from '../pages/Login';
import Home from '../pages/Home';
import Empleados from '../pages/Empleados';
import Contratos from '../pages/Contratos';
import Asistencia from '../pages/Asistencia';
import Liquidaciones from '../pages/Liquidaciones';
import ReporteAsistencia from '../pages/ReporteAsistencia';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/empleados" element={<Empleados />} />
          <Route path="/empleados/:empleadoId/contratos" element={<Contratos />} />
          <Route path="/empleados/:empleadoId/asistencia" element={<Asistencia />} />
          <Route path="/empleados/:empleadoId/liquidaciones" element={<Liquidaciones />} />
          <Route path="/reportes/asistencia" element={<ReporteAsistencia />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default AppRoutes;
