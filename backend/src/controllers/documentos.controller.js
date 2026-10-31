const documentosService = require('../services/documentos.service');

function manejarError(res, err) {
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: 'Error interno del servidor' });
}

async function listar(req, res) {
  try {
    const { empleado_id, tipo, pagina, por_pagina: porPagina } = req.query;
    const resultado = await documentosService.listarDocumentos(empleado_id, { tipo, pagina, porPagina });
    res.json(resultado);
  } catch (err) {
    manejarError(res, err);
  }
}

async function subir(req, res) {
  try {
    const documento = await documentosService.subirDocumento(req.body.empleado_id, req.file, req.body);
    res.status(201).json(documento);
  } catch (err) {
    manejarError(res, err);
  }
}

async function eliminar(req, res) {
  try {
    await documentosService.eliminarDocumento(req.params.id);
    res.status(204).send();
  } catch (err) {
    manejarError(res, err);
  }
}

module.exports = { listar, subir, eliminar };
