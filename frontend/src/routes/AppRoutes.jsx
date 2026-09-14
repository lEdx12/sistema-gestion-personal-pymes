import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import Empleados from '../pages/Empleados';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/empleados" element={<Empleados />} />
    </Routes>
  );
}

export default AppRoutes;
