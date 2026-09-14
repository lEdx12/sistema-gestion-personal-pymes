const express = require('express');
const controller = require('../controllers/contratos.controller');

const router = express.Router();

router.get('/', controller.listar);
router.get('/:id', controller.obtener);
router.post('/', controller.crear);
router.put('/:id', controller.actualizar);
router.put('/:id/renovar', controller.renovar);

module.exports = router;
