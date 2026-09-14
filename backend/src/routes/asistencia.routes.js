const express = require('express');
const controller = require('../controllers/asistencia.controller');

const router = express.Router();

router.get('/', controller.listar);
router.get('/resumen-semanal', controller.resumenSemanal);
router.get('/:id', controller.obtener);
router.post('/entrada', controller.entrada);
router.post('/ausencia', controller.ausencia);
router.put('/:id/salida', controller.salida);
router.put('/:id', controller.actualizar);

module.exports = router;
