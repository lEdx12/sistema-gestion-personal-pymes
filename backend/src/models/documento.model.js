const pool = require('../config/db');

const COLUMNAS = 'id, empleado_id, nombre, tipo, url, created_at';

async function findAllByEmpleado(empleadoId, { tipo } = {}) {
  const condiciones = ['empleado_id = $1'];
  const valores = [empleadoId];

  if (tipo) {
    valores.push(`%${tipo}%`);
    condiciones.push(`tipo ILIKE $${valores.length}`);
  }

  const { rows } = await pool.query(
    `SELECT ${COLUMNAS} FROM documentos WHERE ${condiciones.join(' AND ')} ORDER BY created_at DESC`,
    valores,
  );
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query(`SELECT ${COLUMNAS} FROM documentos WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function create({ empleado_id, nombre, tipo, url }) {
  const { rows } = await pool.query(
    `INSERT INTO documentos (empleado_id, nombre, tipo, url)
     VALUES ($1, $2, $3, $4)
     RETURNING ${COLUMNAS}`,
    [empleado_id, nombre, tipo, url],
  );
  return rows[0];
}

async function eliminar(id) {
  await pool.query('DELETE FROM documentos WHERE id = $1', [id]);
}

module.exports = { findAllByEmpleado, findById, create, eliminar };
