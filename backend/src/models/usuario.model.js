const pool = require('../config/db');

const COLUMNAS_PUBLICAS = 'id, nombre, email, rol, activo, created_at';

/** Incluye password_hash — solo para verificar credenciales en el login. */
async function findByEmailConHash(email) {
  const { rows } = await pool.query(
    `SELECT id, nombre, email, password_hash, rol, activo FROM usuarios WHERE email = $1`,
    [email],
  );
  return rows[0] || null;
}

async function findById(id) {
  const { rows } = await pool.query(`SELECT ${COLUMNAS_PUBLICAS} FROM usuarios WHERE id = $1`, [id]);
  return rows[0] || null;
}

module.exports = { findByEmailConHash, findById };
