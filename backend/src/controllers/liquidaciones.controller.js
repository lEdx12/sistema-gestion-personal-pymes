const liquidacionesService = require('../services/liquidaciones.service');

function manejarError(res, err) {
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: 'Error interno del servidor' });
}

async function listar(req, res) {
  try {
    const { empleado_id, periodo } = req.query;
    const liquidaciones = await liquidacionesService.listarLiquidaciones({
      empleadoId: empleado_id,
      periodo,
    });
    res.json(liquidaciones);
  } catch (err) {
    manejarError(res, err);
  }
}

async function obtener(req, res) {
  try {
    const liquidacion = await liquidacionesService.obtenerLiquidacion(req.params.id);
    res.json(liquidacion);
  } catch (err) {
    manejarError(res, err);
  }
}

async function generar(req, res) {
  try {
    const liquidacion = await liquidacionesService.generarLiquidacion(req.body);
    res.status(201).json(liquidacion);
  } catch (err) {
    manejarError(res, err);
  }
}

module.exports = { listar, obtener, generar };
