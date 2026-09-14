import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import Empleados from '../pages/Empleados';
import Contratos from '../pages/Contratos';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/empleados" element={<Empleados />} />
      <Route path="/empleados/:empleadoId/contratos" element={<Contratos />} />
    </Routes>
  );
}

export default AppRoutes;
