const contratosService = require('../services/contratos.service');

function manejarError(res, err) {
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: 'Error interno del servidor' });
}

async function listar(req, res) {
  try {
    const { empleado_id } = req.query;
    const contratos = await contratosService.listarContratos({ empleadoId: empleado_id });
    res.json(contratos);
  } catch (err) {
    manejarError(res, err);
  }
}

async function obtener(req, res) {
  try {
    const contrato = await contratosService.obtenerContrato(req.params.id);
    res.json(contrato);
  } catch (err) {
    manejarError(res, err);
  }
}

async function crear(req, res) {
  try {
    const contrato = await contratosService.crearContrato(req.body);
    res.status(201).json(contrato);
  } catch (err) {
    manejarError(res, err);
  }
}

async function actualizar(req, res) {
  try {
    const contrato = await contratosService.actualizarContrato(req.params.id, req.body);
    res.json(contrato);
  } catch (err) {
    manejarError(res, err);
  }
}

async function renovar(req, res) {
  try {
    const contrato = await contratosService.renovarContrato(req.params.id, req.body);
    res.status(201).json(contrato);
  } catch (err) {
    manejarError(res, err);
  }
}

module.exports = { listar, obtener, crear, actualizar, renovar };
