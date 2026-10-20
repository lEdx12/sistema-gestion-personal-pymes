const pool = require('../config/db');

const COLUMNAS = `
  a.id, a.empleado_id, a.contrato_id, a.tipo, a.mensaje, a.fecha_alerta, a.leida, a.created_at
`;
const COLUMNAS_PLANAS = 'id, empleado_id, contrato_id, tipo, mensaje, fecha_alerta, leida, created_at';

async function findAll({ soloNoLeidas = false } = {}) {
  const where = soloNoLeidas ? 'WHERE a.leida = FALSE' : '';
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS}, e.nombre AS empleado_nombre, e.apellido AS empleado_apellido, e.rut AS empleado_rut
     FROM alertas a
     JOIN empleados e ON e.id = a.empleado_id
     ${where}
     ORDER BY a.fecha_alerta DESC, a.id DESC`,
  );
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query(`SELECT ${COLUMNAS} FROM alertas a WHERE a.id = $1`, [id]);
  return rows[0] || null;
}

/** Evita generar dos veces la misma alerta para un contrato (ver alertas.service.js). */
async function existePorContrato(contratoId, tipo) {
  const { rows } = await pool.query(
    'SELECT 1 FROM alertas WHERE contrato_id = $1 AND tipo = $2',
    [contratoId, tipo],
  );
  return rows.length > 0;
}

/**
 * Contratos a plazo fijo, activos, cuyo vencimiento cae dentro de `diasAnticipacion`
 * días desde hoy (incluye los ya vencidos, para no dejar de avisar si el job no
 * corrió a tiempo).
 */
async function findContratosPorVencer(diasAnticipacion) {
  const { rows } = await pool.query(
    `SELECT c.id AS contrato_id, c.empleado_id, c.fecha_termino,
            e.nombre AS empleado_nombre, e.apellido AS empleado_apellido, e.rut AS empleado_rut
     FROM contratos c
     JOIN empleados e ON e.id = c.empleado_id
     WHERE c.activo = TRUE
       AND c.tipo = 'plazo_fijo'
       AND c.fecha_termino IS NOT NULL
       AND c.fecha_termino <= CURRENT_DATE + $1::INT`,
    [diasAnticipacion],
  );
  return rows;
}

async function create({ empleado_id, contrato_id, tipo, mensaje, fecha_alerta }) {
  const { rows } = await pool.query(
    `INSERT INTO alertas (empleado_id, contrato_id, tipo, mensaje, fecha_alerta)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${COLUMNAS_PLANAS}`,
    [empleado_id, contrato_id, tipo, mensaje, fecha_alerta],
  );
  return rows[0];
}

async function marcarLeida(id) {
  const { rows } = await pool.query(
    `UPDATE alertas SET leida = TRUE WHERE id = $1 RETURNING ${COLUMNAS_PLANAS}`,
    [id],
  );
  return rows[0] || null;
}

module.exports = {
  findAll,
  findById,
  existePorContrato,
  findContratosPorVencer,
  create,
  marcarLeida,
};
