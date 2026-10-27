const express = require('express');
const controller = require('../controllers/empleados.controller');
const { permitirRoles } = require('../middleware/roles');

const router = express.Router();

// Lista acotada (id/rut/nombre) para elegir un empleado en un reporte — el Gerente la
// necesita para el reporte de asistencia individual (RF-12), aunque no gestione la
// ficha completa. Debe registrarse antes del router.use() de abajo y antes de
// GET /:id, para que Express no la confunda con esa ruta ("selector" calzaría como :id).
router.get('/selector', permitirRoles('administrador', 'gerente'), controller.selector);

// RF-02: el resto de la ficha de empleados no es uno de los "reportes, liquidaciones e
// historial de remuneraciones" de solo lectura del Gerente (sección 3 de PROJECT.md).
router.use(permitirRoles('administrador'));

router.get('/', controller.listar);
router.get('/:id', controller.obtener);
router.post('/', controller.crear);
router.put('/:id', controller.actualizar);
router.put('/:id/desactivar', controller.desactivar);
router.put('/:id/reactivar', controller.reactivar);

module.exports = router;
