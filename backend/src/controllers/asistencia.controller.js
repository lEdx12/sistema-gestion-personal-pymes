const asistenciaService = require('../services/asistencia.service');

function manejarError(res, err) {
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: 'Error interno del servidor' });
}

async function listar(req, res) {
  try {
    const { empleado_id, desde, hasta } = req.query;
    const registros = await asistenciaService.listarAsistencia({ empleadoId: empleado_id, desde, hasta });
    res.json(registros);
  } catch (err) {
    manejarError(res, err);
  }
}

async function obtener(req, res) {
  try {
    const registro = await asistenciaService.obtenerAsistencia(req.params.id);
    res.json(registro);
  } catch (err) {
    manejarError(res, err);
  }
}

async function entrada(req, res) {
  try {
    const registro = await asistenciaService.registrarEntrada(req.body);
    res.status(201).json(registro);
  } catch (err) {
    manejarError(res, err);
  }
}

async function salida(req, res) {
  try {
    const registro = await asistenciaService.registrarSalida(req.params.id, req.body);
    res.json(registro);
  } catch (err) {
    manejarError(res, err);
  }
}

async function ausencia(req, res) {
  try {
    const registro = await asistenciaService.registrarAusencia(req.body);
    res.status(201).json(registro);
  } catch (err) {
    manejarError(res, err);
  }
}

async function resumenSemanal(req, res) {
  try {
    const { empleado_id, desde, hasta } = req.query;
    const resumen = await asistenciaService.obtenerResumenSemanal({
      empleadoId: empleado_id,
      desde,
      hasta,
    });
    res.json(resumen);
  } catch (err) {
    manejarError(res, err);
  }
}

module.exports = { listar, obtener, entrada, salida, ausencia, resumenSemanal };
