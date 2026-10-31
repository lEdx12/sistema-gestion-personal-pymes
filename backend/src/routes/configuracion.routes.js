const express = require('express');
const controller = require('../controllers/configuracion.controller');
const { permitirRoles } = require('../middleware/roles');

const router = express.Router();

// RF-16/RF-17: la configuración de sueldo y los tramos de impuesto único son
// exclusivos del Administrador (afectan el cálculo de todas las liquidaciones).
router.use(permitirRoles('administrador'));

router.get('/', controller.obtener);
router.put('/', controller.actualizar);
router.get('/tramos-impuesto', controller.listarTramos);
router.put('/tramos-impuesto', controller.actualizarTramos);

module.exports = router;
