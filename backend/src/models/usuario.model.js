const pool = require('../config/db');

const COLUMNAS_PUBLICAS = 'id, nombre, email, rol, activo, created_at';

async function findAll({ incluirInactivos = false } = {}) {
  const where = incluirInactivos ? '' : 'WHERE activo = TRUE';
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS_PUBLICAS} FROM usuarios ${where} ORDER BY nombre`,
  );
  return rows;
}

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

async function create({ nombre, email, password_hash, rol }) {
  const { rows } = await pool.query(
    `INSERT INTO usuarios (nombre, email, password_hash, rol)
     VALUES ($1, $2, $3, $4)
     RETURNING ${COLUMNAS_PUBLICAS}`,
    [nombre, email, password_hash, rol],
  );
  return rows[0];
}

async function update(id, { nombre, email, rol }) {
  const { rows } = await pool.query(
    `UPDATE usuarios SET nombre = $1, email = $2, rol = $3
     WHERE id = $4
     RETURNING ${COLUMNAS_PUBLICAS}`,
    [nombre, email, rol, id],
  );
  return rows[0] || null;
}

async function updatePassword(id, password_hash) {
  await pool.query('UPDATE usuarios SET password_hash = $1 WHERE id = $2', [password_hash, id]);
}

async function desactivar(id) {
  const { rows } = await pool.query(
    `UPDATE usuarios SET activo = FALSE WHERE id = $1 RETURNING ${COLUMNAS_PUBLICAS}`,
    [id],
  );
  return rows[0] || null;
}

async function reactivar(id) {
  const { rows } = await pool.query(
    `UPDATE usuarios SET activo = TRUE WHERE id = $1 RETURNING ${COLUMNAS_PUBLICAS}`,
    [id],
  );
  return rows[0] || null;
}

module.exports = {
  findAll,
  findByEmailConHash,
  findById,
  create,
  update,
  updatePassword,
  desactivar,
  reactivar,
};
