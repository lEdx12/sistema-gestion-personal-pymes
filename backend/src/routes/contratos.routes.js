const express = require('express');
const controller = require('../controllers/contratos.controller');
const subirDocumentoContrato = require('../middleware/uploadContrato');
const contratosService = require('../services/contratos.service');

const router = express.Router();

/** Verifica que el contrato exista antes de aceptar el archivo, para no escribirlo en disco en vano. */
async function verificarContratoExiste(req, res, next) {
  try {
    await contratosService.obtenerContrato(req.params.id);
    next();
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
}

router.get('/', controller.listar);
router.get('/:id', controller.obtener);
router.post('/', controller.crear);
router.put('/:id', controller.actualizar);
router.put('/:id/renovar', controller.renovar);
router.post(
  '/:id/documento',
  verificarContratoExiste,
  subirDocumentoContrato,
  controller.subirDocumento,
);

module.exports = router;
