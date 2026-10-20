const express = require('express');
const controller = require('../controllers/empleados.controller');
const { permitirRoles } = require('../middleware/roles');

const router = express.Router();

// RF-02: la ficha de empleados no es uno de los "reportes, liquidaciones e
// historial de remuneraciones" de solo lectura del Gerente (sección 3 de PROJECT.md).
router.use(permitirRoles('administrador'));

router.get('/', controller.listar);
router.get('/:id', controller.obtener);
router.post('/', controller.crear);
router.put('/:id', controller.actualizar);
router.put('/:id/desactivar', controller.desactivar);
router.put('/:id/reactivar', controller.reactivar);

module.exports = router;
