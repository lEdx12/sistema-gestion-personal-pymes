const configuracionService = require('../services/configuracion.service');

function manejarError(res, err) {
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: 'Error interno del servidor' });
}

async function obtener(req, res) {
  try {
    const config = await configuracionService.obtenerConfiguracion();
    res.json(config);
  } catch (err) {
    manejarError(res, err);
  }
}

async function actualizar(req, res) {
  try {
    const config = await configuracionService.actualizarConfiguracion(req.body, req.user.id);
    res.json(config);
  } catch (err) {
    manejarError(res, err);
  }
}

async function listarTramos(req, res) {
  try {
    const tramos = await configuracionService.listarTramosImpuesto();
    res.json(tramos);
  } catch (err) {
    manejarError(res, err);
  }
}

async function actualizarTramos(req, res) {
  try {
    const tramos = await configuracionService.actualizarTramosImpuesto(req.body.tramos);
    res.json(tramos);
  } catch (err) {
    manejarError(res, err);
  }
}

module.exports = { obtener, actualizar, listarTramos, actualizarTramos };
