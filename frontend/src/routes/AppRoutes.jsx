import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import Empleados from '../pages/Empleados';
import Contratos from '../pages/Contratos';
import Asistencia from '../pages/Asistencia';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/empleados" element={<Empleados />} />
      <Route path="/empleados/:empleadoId/contratos" element={<Contratos />} />
      <Route path="/empleados/:empleadoId/asistencia" element={<Asistencia />} />
    </Routes>
  );
}

export default AppRoutes;
