const pool = require('../config/db');

const COLUMNAS = `
  id, rut, nombre, apellido, fecha_nacimiento, direccion, telefono, email,
  fecha_ingreso, cargo, sueldo_base, activo
`;

async function findAll({ incluirInactivos = false } = {}) {
  const where = incluirInactivos ? '' : 'WHERE activo = TRUE';
  const { rows } = await pool.query(
    `SELECT ${COLUMNAS} FROM empleados ${where} ORDER BY apellido, nombre`,
  );
  return rows;
}

async function findById(id) {
  const { rows } = await pool.query(`SELECT ${COLUMNAS} FROM empleados WHERE id = $1`, [id]);
  return rows[0] || null;
}

async function findByRut(rut) {
  const { rows } = await pool.query(`SELECT ${COLUMNAS} FROM empleados WHERE rut = $1`, [rut]);
  return rows[0] || null;
}

async function create(empleado) {
  const {
    rut,
    nombre,
    apellido,
    fecha_nacimiento,
    direccion,
    telefono,
    email,
    fecha_ingreso,
    cargo,
    sueldo_base,
  } = empleado;

  const { rows } = await pool.query(
    `INSERT INTO empleados
      (rut, nombre, apellido, fecha_nacimiento, direccion, telefono, email, fecha_ingreso, cargo, sueldo_base)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING ${COLUMNAS}`,
    [
      rut,
      nombre,
      apellido,
      fecha_nacimiento || null,
      direccion || null,
      telefono || null,
      email || null,
      fecha_ingreso,
      cargo || null,
      sueldo_base,
    ],
  );
  return rows[0];
}

async function update(id, empleado) {
  const {
    nombre,
    apellido,
    fecha_nacimiento,
    direccion,
    telefono,
    email,
    fecha_ingreso,
    cargo,
    sueldo_base,
  } = empleado;

  const { rows } = await pool.query(
    `UPDATE empleados SET
      nombre = $1, apellido = $2, fecha_nacimiento = $3, direccion = $4,
      telefono = $5, email = $6, fecha_ingreso = $7, cargo = $8, sueldo_base = $9
     WHERE id = $10
     RETURNING ${COLUMNAS}`,
    [
      nombre,
      apellido,
      fecha_nacimiento || null,
      direccion || null,
      telefono || null,
      email || null,
      fecha_ingreso,
      cargo || null,
      sueldo_base,
      id,
    ],
  );
  return rows[0] || null;
}

async function desactivar(id) {
  const { rows } = await pool.query(
    `UPDATE empleados SET activo = FALSE WHERE id = $1 RETURNING ${COLUMNAS}`,
    [id],
  );
  return rows[0] || null;
}

module.exports = { findAll, findById, findByRut, create, update, desactivar };
