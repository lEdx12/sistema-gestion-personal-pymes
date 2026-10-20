const express = require('express');
const controller = require('../controllers/alertas.controller');
const { permitirRoles } = require('../middleware/roles');

const router = express.Router();

// RF-02: las alertas de vencimiento de contrato son del mismo ámbito que
// contratos/empleados — exclusivas del Administrador, no un "reporte" del Gerente.
router.use(permitirRoles('administrador'));

router.get('/', controller.listar);
router.put('/:id/leida', controller.marcarLeida);
router.post('/generar', controller.generar);

module.exports = router;
