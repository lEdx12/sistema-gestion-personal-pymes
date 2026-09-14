const pool = require('../config/db');

const COLUMNAS = `
  id, empleado_id, fecha, hora_entrada, hora_salida, horas_trabajadas,
  horas_extra, ausente, justificacion
`;

async function findAll({ empleadoId, desde, hasta } = {}) {
  const condiciones = [];
  const valores = [];

  if (empleadoId) {
    valores.push(empleadoId);
    condiciones.push(`empleado_id = $${valores.length}`);
  }
  if (desde) {
    valores.push(desde);
    condiciones.push(`fecha >= $${valores.length}`);
  }
  if (hasta) {
    valores.push(hasta);
    condiciones.push(`fecha <= $${valores.length}`);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS} FROM asistencia ${where} ORDER BY fecha DESC`,
    valores,
  );
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query(`SELECT ${COLUMNAS} FROM asistencia WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function findByEmpleadoFecha(empleadoId, fecha) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS} FROM asistencia WHERE empleado_id = $1 AND fecha = $2`,
    [empleadoId, fecha],
  );
  return rows[0] || null;
}

async function crearMarcajeEntrada({ empleado_id, fecha, hora_entrada }) {
  const { rows } = await pool.query(
    `INSERT INTO asistencia (empleado_id, fecha, hora_entrada, ausente)
     VALUES ($1, $2, $3, FALSE)
     RETURNING ${COLUMNAS}`,
    [empleado_id, fecha, hora_entrada],
  );
  return rows[0];
}

async function crearAusencia({ empleado_id, fecha, justificacion }) {
  const { rows } = await pool.query(
    `INSERT INTO asistencia (empleado_id, fecha, ausente, justificacion)
     VALUES ($1, $2, TRUE, $3)
     RETURNING ${COLUMNAS}`,
    [empleado_id, fecha, justificacion],
  );
  return rows[0];
}

async function marcarSalida(id, horaSalida) {
  const { rows } = await pool.query(
    `UPDATE asistencia SET hora_salida = $1 WHERE id = $2 RETURNING ${COLUMNAS}`,
    [horaSalida, id],
  );
  return rows[0] || null;
}

module.exports = {
  findAll,
  findById,
  findByEmpleadoFecha,
  crearMarcajeEntrada,
  crearAusencia,
  marcarSalida,
};
