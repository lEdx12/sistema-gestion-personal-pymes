const alertasService = require('../services/alertas.service');

function manejarError(res, err) {
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: 'Error interno del servidor' });
}

async function listar(req, res) {
  try {
    const soloNoLeidas = req.query.soloNoLeidas === 'true';
    const alertas = await alertasService.listarAlertas({ soloNoLeidas });
    res.json(alertas);
  } catch (err) {
    manejarError(res, err);
  }
}

async function marcarLeida(req, res) {
  try {
    const alerta = await alertasService.marcarAlertaLeida(req.params.id);
    res.json(alerta);
  } catch (err) {
    manejarError(res, err);
  }
}

/** Dispara manualmente la generación (además del job diario) — útil para pruebas/demo. */
async function generar(req, res) {
  try {
    const generadas = await alertasService.generarAlertasVencimiento();
    res.status(201).json(generadas);
  } catch (err) {
    manejarError(res, err);
  }
}

module.exports = { listar, marcarLeida, generar };
