const bcrypt = require('bcrypt');
const request = require('supertest');
const pool = require('../../src/config/db');
const app = require('../../src/app');

const EMAIL = 'test-admin@local.test';
const PASSWORD = 'Test1234!';

/** Crea (o reactiva) el usuario administrador usado por los tests, de forma idempotente. */
async function asegurarUsuarioDePrueba() {
  const hash = await bcrypt.hash(PASSWORD, 10);
  await pool.query(
    `INSERT INTO usuarios (nombre, email, password_hash, rol, activo)
     VALUES ('Admin de Prueba', $1, $2, 'administrador', TRUE)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash, activo = TRUE`,
    [EMAIL, hash],
  );
}

/** Loguea al usuario de prueba y devuelve el header listo para usar con supertest. */
async function obtenerAuthHeader() {
  await asegurarUsuarioDePrueba();
  const res = await request(app).post('/api/auth/login').send({ email: EMAIL, password: PASSWORD });
  return `Bearer ${res.body.token}`;
}

module.exports = { obtenerAuthHeader, asegurarUsuarioDePrueba, EMAIL, PASSWORD };
