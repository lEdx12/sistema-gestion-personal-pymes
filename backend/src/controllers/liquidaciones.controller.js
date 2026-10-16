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
    const liquidacion = await liquidacionesService.generarLiquidacion({
      ...req.body,
      generado_por: req.user.id,
    });
    res.status(201).json(liquidacion);
  } catch (err) {
    manejarError(res, err);
  }
}

async function descargarPdf(req, res) {
  try {
    const { ruta, nombre } = await liquidacionesService.obtenerPdfLiquidacion(req.params.id);
    res.download(ruta, nombre);
  } catch (err) {
    manejarError(res, err);
  }
}

async function historial(req, res) {
  try {
    const { empleado_id, desde, hasta } = req.query;
    const resultado = await liquidacionesService.obtenerHistorialRemuneraciones({
      empleadoId: empleado_id,
      desde,
      hasta,
    });
    res.json(resultado);
  } catch (err) {
    manejarError(res, err);
  }
}

module.exports = { listar, obtener, generar, descargarPdf, historial };
