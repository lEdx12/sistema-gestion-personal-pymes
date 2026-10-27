const empleadosService = require('../services/empleados.service');

function manejarError(res, err) {
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: 'Error interno del servidor' });
}

async function listar(req, res) {
  try {
    const incluirInactivos = req.query.incluirInactivos === 'true';
    const empleados = await empleadosService.listarEmpleados({ incluirInactivos });
    res.json(empleados);
  } catch (err) {
    manejarError(res, err);
  }
}

async function selector(req, res) {
  try {
    const empleados = await empleadosService.listarResumenEmpleados();
    res.json(empleados);
  } catch (err) {
    manejarError(res, err);
  }
}

async function obtener(req, res) {
  try {
    const empleado = await empleadosService.obtenerEmpleado(req.params.id);
    res.json(empleado);
  } catch (err) {
    manejarError(res, err);
  }
}

async function crear(req, res) {
  try {
    const empleado = await empleadosService.crearEmpleado(req.body);
    res.status(201).json(empleado);
  } catch (err) {
    manejarError(res, err);
  }
}

async function actualizar(req, res) {
  try {
    const empleado = await empleadosService.actualizarEmpleado(req.params.id, req.body);
    res.json(empleado);
  } catch (err) {
    manejarError(res, err);
  }
}

async function desactivar(req, res) {
  try {
    const empleado = await empleadosService.desactivarEmpleado(req.params.id);
    res.json(empleado);
  } catch (err) {
    manejarError(res, err);
  }
}

async function reactivar(req, res) {
  try {
    const empleado = await empleadosService.reactivarEmpleado(req.params.id);
    res.json(empleado);
  } catch (err) {
    manejarError(res, err);
  }
}

module.exports = { listar, selector, obtener, crear, actualizar, desactivar, reactivar };
