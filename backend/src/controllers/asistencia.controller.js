const asistenciaService = require('../services/asistencia.service');
const { generarPdfReporteMensual } = require('../services/reporteAsistenciaPdf.service');
const { slugificar } = require('../utils/slug');

function manejarError(res, err) {
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: 'Error interno del servidor' });
}

async function listar(req, res) {
  try {
    const { empleado_id, desde, hasta, ausente, pagina, por_pagina: porPagina } = req.query;
    const resultado = await asistenciaService.listarAsistencia({
      empleadoId: empleado_id,
      desde,
      hasta,
      ausente: ausente === undefined ? undefined : ausente === 'true',
      pagina,
      porPagina,
    });
    res.json(resultado);
  } catch (err) {
    manejarError(res, err);
  }
}

async function obtener(req, res) {
  try {
    const registro = await asistenciaService.obtenerAsistencia(req.params.id);
    res.json(registro);
  } catch (err) {
    manejarError(res, err);
  }
}

async function entrada(req, res) {
  try {
    const registro = await asistenciaService.registrarEntrada(req.body);
    res.status(201).json(registro);
  } catch (err) {
    manejarError(res, err);
  }
}

async function salida(req, res) {
  try {
    const registro = await asistenciaService.registrarSalida(req.params.id, req.body);
    res.json(registro);
  } catch (err) {
    manejarError(res, err);
  }
}

async function ausencia(req, res) {
  try {
    const registro = await asistenciaService.registrarAusencia(req.body);
    res.status(201).json(registro);
  } catch (err) {
    manejarError(res, err);
  }
}

async function actualizar(req, res) {
  try {
    const registro = await asistenciaService.actualizarAsistencia(req.params.id, req.body);
    res.json(registro);
  } catch (err) {
    manejarError(res, err);
  }
}

async function resumenSemanal(req, res) {
  try {
    const { empleado_id, desde, hasta } = req.query;
    const resumen = await asistenciaService.obtenerResumenSemanal({
      empleadoId: empleado_id,
      desde,
      hasta,
    });
    res.json(resumen);
  } catch (err) {
    manejarError(res, err);
  }
}

async function reporteMensual(req, res) {
  try {
    const { empleado_id, periodo } = req.query;
    const reporte = await asistenciaService.obtenerReporteMensual({
      empleadoId: empleado_id,
      periodo,
    });
    res.json(reporte);
  } catch (err) {
    manejarError(res, err);
  }
}

async function reporteMensualPdf(req, res) {
  try {
    const { empleado_id, periodo } = req.query;
    const reporte = await asistenciaService.obtenerReporteMensual({ empleadoId: empleado_id, periodo });
    const identificador = reporte.empleado
      ? `${slugificar(reporte.empleado.nombre)}-${slugificar(reporte.empleado.apellido)}`
      : 'consolidado';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="reporte-asistencia-${reporte.periodo}-${identificador}.pdf"`,
    );
    generarPdfReporteMensual(reporte).pipe(res);
  } catch (err) {
    manejarError(res, err);
  }
}

module.exports = {
  listar,
  obtener,
  entrada,
  salida,
  ausencia,
  actualizar,
  resumenSemanal,
  reporteMensual,
  reporteMensualPdf,
};
