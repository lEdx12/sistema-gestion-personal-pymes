const pool = require('../config/db');

const COLUMNAS = 'id, orden, desde_utm, hasta_utm, factor, rebaja_utm';

async function findAll() {
  const { rows } = await pool.query(`SELECT ${COLUMNAS} FROM tramos_impuesto_unico ORDER BY orden`);
  return rows;
}

/**
 * Reemplaza toda la tabla de tramos dentro de una transacción (se valida como un
 * conjunto completo y consistente en el service — no tiene sentido editar un tramo
 * suelto, ya que cada uno depende de dónde termina el anterior).
 */
async function reemplazarTodos(tramos) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM tramos_impuesto_unico');
    for (const tramo of tramos) {
      await client.query(
        `INSERT INTO tramos_impuesto_unico (orden, desde_utm, hasta_utm, factor, rebaja_utm)
         VALUES ($1, $2, $3, $4, $5)`,
        [tramo.orden, tramo.desde_utm, tramo.hasta_utm ?? null, tramo.factor, tramo.rebaja_utm],
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  return findAll();
}

module.exports = { findAll, reemplazarTodos };
