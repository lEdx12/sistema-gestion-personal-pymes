const pool = require('../config/db');

const COLUMNAS = `
  id, empleado_id, generado_por, periodo, sueldo_base, horas_extra_monto,
  gratificacion, movilizacion, colacion, descuento_afp, descuento_salud, descuento_cesantia,
  descuento_impuesto, otros_descuentos, total_haberes, total_descuentos, liquido_pagar, pdf_url,
  created_at
`;

async function findAll({ empleadoId, periodo, desde, hasta } = {}) {
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
  // "periodo" es VARCHAR "YYYY-MM": la comparación lexicográfica equivale a la
  // cronológica porque el formato está siempre completo y con ceros a la izquierda.
  if (desde) {
    valores.push(desde);
    condiciones.push(`periodo >= $${valores.length}`);
  }
  if (hasta) {
    valores.push(hasta);
    condiciones.push(`periodo <= $${valores.length}`);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS} FROM liquidaciones ${where} ORDER BY periodo DESC`,
    valores,
  );
  return rows;
}

/** Incluye nombre/apellido/rut del empleado (RF-18: página de detalle) vía JOIN, ya que
 * un Gerente puede ver el detalle de una liquidación sin tener acceso a la ficha
 * completa del empleado (`GET /api/empleados/:id` es exclusivo de Administrador). */
async function findById(id) {
  const { rows } = await pool.query(
    `SELECT l.*, e.nombre AS empleado_nombre, e.apellido AS empleado_apellido, e.rut AS empleado_rut
     FROM liquidaciones l
     JOIN empleados e ON e.id = l.empleado_id
     WHERE l.id = $1`,
    [id],
  );
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
    movilizacion,
    colacion,
    descuento_afp,
    descuento_salud,
    descuento_cesantia,
    descuento_impuesto,
    otros_descuentos,
    total_haberes,
    total_descuentos,
    liquido_pagar,
  } = liquidacion;

  const { rows } = await pool.query(
    `INSERT INTO liquidaciones
      (empleado_id, generado_por, periodo, sueldo_base, horas_extra_monto, gratificacion,
       movilizacion, colacion, descuento_afp, descuento_salud, descuento_cesantia,
       descuento_impuesto, otros_descuentos, total_haberes, total_descuentos, liquido_pagar)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
     RETURNING ${COLUMNAS}`,
    [
      empleado_id,
      generado_por || null,
      periodo,
      sueldo_base,
      horas_extra_monto,
      gratificacion,
      movilizacion || 0,
      colacion || 0,
      descuento_afp,
      descuento_salud,
      descuento_cesantia,
      descuento_impuesto || 0,
      otros_descuentos || 0,
      total_haberes,
      total_descuentos,
      liquido_pagar,
    ],
  );
  return rows[0];
}

async function actualizarPdfUrl(id, pdfUrl) {
  const { rows } = await pool.query(
    `UPDATE liquidaciones SET pdf_url = $1 WHERE id = $2 RETURNING ${COLUMNAS}`,
    [pdfUrl, id],
  );
  return rows[0] || null;
}

module.exports = { findAll, findById, findByEmpleadoPeriodo, create, actualizarPdfUrl };
