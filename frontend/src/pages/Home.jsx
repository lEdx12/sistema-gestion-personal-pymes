import { useEffect, useState } from 'react';
import api from '../services/api';

function Home() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get('/health')
      .then((res) => setHealth(res.data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Sistema de Gestión de Personal para PyMES</h1>
      {error && <p style={{ color: 'red' }}>Error conectando al backend: {error}</p>}
      {health && (
        <p>
          Backend conectado. Usuario de prueba: <strong>{health.user.nombre}</strong> (
          {health.user.rol})
        </p>
      )}
      {!health && !error && <p>Conectando al backend...</p>}
    </div>
  );
}

export default Home;
