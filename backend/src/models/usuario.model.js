const pool = require('../config/db');

const COLUMNAS_PUBLICAS = 'id, nombre, email, rol, activo, debe_cambiar_password, created_at';

async function findAll({ incluirInactivos = false, texto, rol } = {}) {
  const condiciones = [];
  const valores = [];

  if (!incluirInactivos) {
    condiciones.push('activo = TRUE');
  }
  if (texto) {
    valores.push(`%${texto}%`);
    condiciones.push(`(nombre ILIKE $${valores.length} OR email ILIKE $${valores.length})`);
  }
  if (rol) {
    valores.push(rol);
    condiciones.push(`rol = $${valores.length}`);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS_PUBLICAS} FROM usuarios ${where} ORDER BY nombre`,
    valores,
  );
  return rows;
}

/** Incluye password_hash — solo para verificar credenciales en el login. */
async function findByEmailConHash(email) {
  const { rows } = await pool.query(
    `SELECT id, nombre, email, password_hash, rol, activo, debe_cambiar_password
     FROM usuarios WHERE email = $1`,
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

/**
 * debeCambiarPassword decide si la nueva contraseña queda marcada como "genérica" que
 * hay que volver a cambiar: TRUE cuando la fija un Administrador para otra persona
 * (restablecimiento), FALSE cuando el propio usuario elige su contraseña.
 */
async function updatePassword(id, password_hash, debeCambiarPassword) {
  await pool.query(
    'UPDATE usuarios SET password_hash = $1, debe_cambiar_password = $2 WHERE id = $3',
    [password_hash, debeCambiarPassword, id],
  );
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
