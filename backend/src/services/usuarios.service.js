const bcrypt = require('bcrypt');
const usuarioModel = require('../models/usuario.model');

class ServiceError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const ROLES_VALIDOS = ['administrador', 'gerente'];
const SALT_ROUNDS = 10;

function validarRol(rol) {
  if (!ROLES_VALIDOS.includes(rol)) {
    throw new ServiceError(400, `El rol debe ser uno de: ${ROLES_VALIDOS.join(', ')}`);
  }
}

function validarPassword(password) {
  if (!password || password.length < 8) {
    throw new ServiceError(400, 'La contraseña debe tener al menos 8 caracteres');
  }
}

async function listarUsuarios(opciones) {
  return usuarioModel.findAll(opciones);
}

async function obtenerUsuario(id) {
  const usuario = await usuarioModel.findById(id);
  if (!usuario) throw new ServiceError(404, 'Usuario no encontrado');
  return usuario;
}

async function crearUsuario({ nombre, email, password, rol }) {
  if (!nombre || !email || !password || !rol) {
    throw new ServiceError(400, 'Los campos "nombre", "email", "password" y "rol" son obligatorios');
  }
  validarRol(rol);
  validarPassword(password);

  const existente = await usuarioModel.findByEmailConHash(email);
  if (existente) {
    throw new ServiceError(409, 'Ya existe un usuario con ese email');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  return usuarioModel.create({ nombre, email, password_hash: passwordHash, rol });
}

async function actualizarUsuario(id, { nombre, email, rol }) {
  await obtenerUsuario(id);
  if (!nombre || !email || !rol) {
    throw new ServiceError(400, 'Los campos "nombre", "email" y "rol" son obligatorios');
  }
  validarRol(rol);

  const existente = await usuarioModel.findByEmailConHash(email);
  if (existente && existente.id !== Number(id)) {
    throw new ServiceError(409, 'Ya existe un usuario con ese email');
  }

  return usuarioModel.update(id, { nombre, email, rol });
}

async function cambiarPassword(id, password) {
  await obtenerUsuario(id);
  validarPassword(password);
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  await usuarioModel.updatePassword(id, passwordHash);
}

async function desactivarUsuario(id) {
  await obtenerUsuario(id);
  return usuarioModel.desactivar(id);
}

async function reactivarUsuario(id) {
  await obtenerUsuario(id);
  return usuarioModel.reactivar(id);
}

module.exports = {
  ServiceError,
  listarUsuarios,
  obtenerUsuario,
  crearUsuario,
  actualizarUsuario,
  cambiarPassword,
  desactivarUsuario,
  reactivarUsuario,
};
