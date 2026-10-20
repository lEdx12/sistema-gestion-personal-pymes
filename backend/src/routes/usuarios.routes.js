const express = require('express');
const controller = require('../controllers/usuarios.controller');
const { permitirRoles } = require('../middleware/roles');

const router = express.Router();

// RF-02 + RF-14: gestionar cuentas de usuario es exclusivo del Administrador.
router.use(permitirRoles('administrador'));

router.get('/', controller.listar);
router.get('/:id', controller.obtener);
router.post('/', controller.crear);
router.put('/:id', controller.actualizar);
router.put('/:id/password', controller.cambiarPassword);
router.put('/:id/desactivar', controller.desactivar);
router.put('/:id/reactivar', controller.reactivar);

module.exports = router;
