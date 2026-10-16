import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/useAuth';

function Home() {
  const { usuario } = useAuth();
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get('/health')
      .then((res) => setHealth(res.data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="card">
      <h1>Sistema de Gestión de Personal para PyMES</h1>
      {error && <p className="field-error">Error conectando al backend: {error}</p>}
      {health && (
        <p>
          Backend conectado. Sesión iniciada como <strong>{usuario?.nombre}</strong> (
          {usuario?.rol}).
        </p>
      )}
      {!health && !error && <p>Conectando al backend...</p>}
      <p>
        <Link to="/empleados">Ir a Empleados →</Link>
      </p>
    </div>
  );
}

export default Home;
