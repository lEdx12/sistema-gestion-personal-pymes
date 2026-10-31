const pool = require('../config/db');

const COLUMNAS = `
  afp_porcentaje, salud_porcentaje, afc_indefinido_porcentaje, afc_plazo_fijo_porcentaje,
  gratificacion_porcentaje, gratificacion_tope_mensual, movilizacion_monto, colacion_monto,
  valor_utm, updated_at
`;

async function obtener() {
  const { rows } = await pool.query(`SELECT ${COLUMNAS} FROM configuracion_sueldo WHERE id = 1`);
  return rows[0] || null;
}

async function actualizar(datos, actualizadoPor) {
  const {
    afp_porcentaje,
    salud_porcentaje,
    afc_indefinido_porcentaje,
    afc_plazo_fijo_porcentaje,
    gratificacion_porcentaje,
    gratificacion_tope_mensual,
    movilizacion_monto,
    colacion_monto,
    valor_utm,
  } = datos;

  const { rows } = await pool.query(
    `UPDATE configuracion_sueldo SET
      afp_porcentaje = $1, salud_porcentaje = $2, afc_indefinido_porcentaje = $3,
      afc_plazo_fijo_porcentaje = $4, gratificacion_porcentaje = $5, gratificacion_tope_mensual = $6,
      movilizacion_monto = $7, colacion_monto = $8, valor_utm = $9,
      updated_at = NOW(), updated_by = $10
     WHERE id = 1
     RETURNING ${COLUMNAS}`,
    [
      afp_porcentaje,
      salud_porcentaje,
      afc_indefinido_porcentaje,
      afc_plazo_fijo_porcentaje,
      gratificacion_porcentaje,
      gratificacion_tope_mensual,
      movilizacion_monto,
      colacion_monto,
      valor_utm,
      actualizadoPor || null,
    ],
  );
  return rows[0];
}

module.exports = { obtener, actualizar };
