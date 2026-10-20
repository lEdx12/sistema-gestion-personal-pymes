const express = require('express');
const controller = require('../controllers/liquidaciones.controller');
const { permitirRoles } = require('../middleware/roles');

const router = express.Router();

// RF-02: liquidaciones e historial de remuneraciones son de solo lectura para el
// Gerente (sección 3 de PROJECT.md); generar una liquidación sigue siendo exclusivo
// del Administrador.
router.get('/', permitirRoles('administrador', 'gerente'), controller.listar);
router.get('/historial', permitirRoles('administrador', 'gerente'), controller.historial);
router.get('/:id', permitirRoles('administrador', 'gerente'), controller.obtener);
router.get('/:id/pdf', permitirRoles('administrador', 'gerente'), controller.descargarPdf);
router.post('/', permitirRoles('administrador'), controller.generar);

module.exports = router;
