const express = require('express');
const controller = require('../controllers/liquidaciones.controller');

const router = express.Router();

router.get('/', controller.listar);
router.get('/:id', controller.obtener);
router.get('/:id/pdf', controller.descargarPdf);
router.post('/', controller.generar);

module.exports = router;
