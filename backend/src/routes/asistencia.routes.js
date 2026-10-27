const express = require('express');
const controller = require('../controllers/asistencia.controller');
const { permitirRoles } = require('../middleware/roles');

const router = express.Router();

// RF-02: reporte-mensual es uno de los "reportes" de solo lectura que el Gerente
// puede ver (sección 3 de PROJECT.md); el resto de asistencia es solo Administrador.
router.get('/', permitirRoles('administrador'), controller.listar);
router.get('/resumen-semanal', permitirRoles('administrador'), controller.resumenSemanal);
router.get('/reporte-mensual', permitirRoles('administrador', 'gerente'), controller.reporteMensual);
router.get('/reporte-mensual/pdf', permitirRoles('administrador', 'gerente'), controller.reporteMensualPdf);
router.get('/:id', permitirRoles('administrador'), controller.obtener);
router.post('/entrada', permitirRoles('administrador'), controller.entrada);
router.post('/ausencia', permitirRoles('administrador'), controller.ausencia);
router.put('/:id/salida', permitirRoles('administrador'), controller.salida);
router.put('/:id', permitirRoles('administrador'), controller.actualizar);

module.exports = router;
