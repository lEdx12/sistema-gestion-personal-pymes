const express = require('express');
const controller = require('../controllers/documentos.controller');
const subirDocumento = require('../middleware/uploadDocumento');
const { permitirRoles } = require('../middleware/roles');

const router = express.Router();

// RF-02: repositorio de documentos del empleado, igual que empleados/contratos —
// exclusivo del Administrador.
router.use(permitirRoles('administrador'));

router.get('/', controller.listar);
router.post('/', subirDocumento, controller.subir);
router.delete('/:id', controller.eliminar);

module.exports = router;
