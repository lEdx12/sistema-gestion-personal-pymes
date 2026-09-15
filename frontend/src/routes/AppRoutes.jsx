import { Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout';
import Home from '../pages/Home';
import Empleados from '../pages/Empleados';
import Contratos from '../pages/Contratos';
import Asistencia from '../pages/Asistencia';

function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/empleados" element={<Empleados />} />
        <Route path="/empleados/:empleadoId/contratos" element={<Contratos />} />
        <Route path="/empleados/:empleadoId/asistencia" element={<Asistencia />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
