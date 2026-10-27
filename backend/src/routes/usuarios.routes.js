const express = require('express');
const controller = require('../controllers/usuarios.controller');
const { permitirRoles } = require('../middleware/roles');

const router = express.Router();

// Cambiar la propia contraseña: cualquier usuario autenticado, sin restricción de rol
// (lo necesita también un Gerente para completar el cambio obligatorio del primer
// login). Debe registrarse antes del router.use() de abajo y antes de
// PUT /:id/password, para que Express no la confunda con esa ruta ("me" calzaría
// como :id).
router.put('/me/password', controller.cambiarMiPassword);

// RF-02 + RF-14: el resto de la gestión de usuarios es exclusivo del Administrador.
router.use(permitirRoles('administrador'));

router.get('/', controller.listar);
router.get('/:id', controller.obtener);
router.post('/', controller.crear);
router.put('/:id', controller.actualizar);
router.put('/:id/password', controller.cambiarPassword);
router.put('/:id/desactivar', controller.desactivar);
router.put('/:id/reactivar', controller.reactivar);

module.exports = router;
