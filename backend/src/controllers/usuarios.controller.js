const usuariosService = require('../services/usuarios.service');

function manejarError(res, err) {
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: 'Error interno del servidor' });
}

async function listar(req, res) {
  try {
    const incluirInactivos = req.query.incluirInactivos === 'true';
    const usuarios = await usuariosService.listarUsuarios({ incluirInactivos });
    res.json(usuarios);
  } catch (err) {
    manejarError(res, err);
  }
}

async function obtener(req, res) {
  try {
    const usuario = await usuariosService.obtenerUsuario(req.params.id);
    res.json(usuario);
  } catch (err) {
    manejarError(res, err);
  }
}

async function crear(req, res) {
  try {
    const usuario = await usuariosService.crearUsuario(req.body);
    res.status(201).json(usuario);
  } catch (err) {
    manejarError(res, err);
  }
}

async function actualizar(req, res) {
  try {
    const usuario = await usuariosService.actualizarUsuario(req.params.id, req.body);
    res.json(usuario);
  } catch (err) {
    manejarError(res, err);
  }
}

async function cambiarPassword(req, res) {
  try {
    await usuariosService.cambiarPassword(req.params.id, req.body.password);
    res.status(204).send();
  } catch (err) {
    manejarError(res, err);
  }
}

async function desactivar(req, res) {
  try {
    const usuario = await usuariosService.desactivarUsuario(req.params.id);
    res.json(usuario);
  } catch (err) {
    manejarError(res, err);
  }
}

async function reactivar(req, res) {
  try {
    const usuario = await usuariosService.reactivarUsuario(req.params.id);
    res.json(usuario);
  } catch (err) {
    manejarError(res, err);
  }
}

module.exports = { listar, obtener, crear, actualizar, cambiarPassword, desactivar, reactivar };
