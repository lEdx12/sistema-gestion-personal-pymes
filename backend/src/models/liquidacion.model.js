const pool = require('../config/db');

const COLUMNAS = `
  id, empleado_id, generado_por, periodo, sueldo_base, horas_extra_monto,
  gratificacion, descuento_afp, descuento_salud, descuento_cesantia,
  otros_descuentos, total_haberes, total_descuentos, liquido_pagar, pdf_url,
  created_at
`;

async function findAll({ empleadoId, periodo } = {}) {
  const condiciones = [];
  const valores = [];

  if (empleadoId) {
    valores.push(empleadoId);
    condiciones.push(`empleado_id = $${valores.length}`);
  }
  if (periodo) {
    valores.push(periodo);
    condiciones.push(`periodo = $${valores.length}`);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS} FROM liquidaciones ${where} ORDER BY periodo DESC`,
    valores,
  );
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query(`SELECT ${COLUMNAS} FROM liquidaciones WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function findByEmpleadoPeriodo(empleadoId, periodo) {
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS} FROM liquidaciones WHERE empleado_id = $1 AND periodo = $2`,
    [empleadoId, periodo],
  );
  return rows[0] || null;
}

async function create(liquidacion) {
  const {
    empleado_id,
    generado_por,
    periodo,
    sueldo_base,
    horas_extra_monto,
    gratificacion,
    descuento_afp,
    descuento_salud,
    descuento_cesantia,
    otros_descuentos,
    total_haberes,
    total_descuentos,
    liquido_pagar,
  } = liquidacion;

  const { rows } = await pool.query(
    `INSERT INTO liquidaciones
      (empleado_id, generado_por, periodo, sueldo_base, horas_extra_monto, gratificacion,
       descuento_afp, descuento_salud, descuento_cesantia, otros_descuentos,
       total_haberes, total_descuentos, liquido_pagar)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     RETURNING ${COLUMNAS}`,
    [
      empleado_id,
      generado_por || null,
      periodo,
      sueldo_base,
      horas_extra_monto,
      gratificacion,
      descuento_afp,
      descuento_salud,
      descuento_cesantia,
      otros_descuentos || 0,
      total_haberes,
      total_descuentos,
      liquido_pagar,
    ],
  );
  return rows[0];
}

module.exports = { findAll, findById, findByEmpleadoPeriodo, create };
