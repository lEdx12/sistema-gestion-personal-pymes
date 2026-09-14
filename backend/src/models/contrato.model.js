const pool = require('../config/db');

const COLUMNAS = `
  id, empleado_id, tipo, fecha_inicio, fecha_termino, documento_url, activo, created_at
`;

async function findAll({ empleadoId } = {}) {
  if (empleadoId) {
    const { rows } = await pool.query(
      `SELECT ${COLUMNAS} FROM contratos WHERE empleado_id = $1 ORDER BY fecha_inicio DESC`,
      [empleadoId],
    );
    return rows;
  }
  const { rows } = await pool.query(`SELECT ${COLUMNAS} FROM contratos ORDER BY fecha_inicio DESC`);
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query(`SELECT ${COLUMNAS} FROM contratos WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function findActivoByEmpleado(empleadoId, client = pool) {
  const { rows } = await client.query(
    `SELECT ${COLUMNAS} FROM contratos WHERE empleado_id = $1 AND activo = TRUE`,
    [empleadoId],
  );
  return rows[0] || null;
}

async function create(contrato, client = pool) {
  const { empleado_id, tipo, fecha_inicio, fecha_termino, documento_url } = contrato;
  const { rows } = await client.query(
    `INSERT INTO contratos (empleado_id, tipo, fecha_inicio, fecha_termino, documento_url)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${COLUMNAS}`,
    [empleado_id, tipo, fecha_inicio, fecha_termino || null, documento_url || null],
  );
  return rows[0];
}

async function update(id, contrato) {
  const { tipo, fecha_inicio, fecha_termino, documento_url } = contrato;
  const { rows } = await pool.query(
    `UPDATE contratos SET tipo = $1, fecha_inicio = $2, fecha_termino = $3, documento_url = $4
     WHERE id = $5
     RETURNING ${COLUMNAS}`,
    [tipo, fecha_inicio, fecha_termino || null, documento_url || null, id],
  );
  return rows[0] || null;
}

async function cerrar(id, fechaTermino, client = pool) {
  const { rows } = await client.query(
    `UPDATE contratos SET activo = FALSE, fecha_termino = $1 WHERE id = $2 RETURNING ${COLUMNAS}`,
    [fechaTermino, id],
  );
  return rows[0] || null;
}

module.exports = { findAll, findById, findActivoByEmpleado, create, update, cerrar };
