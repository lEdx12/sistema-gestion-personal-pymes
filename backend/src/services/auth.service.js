const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const usuarioModel = require('../models/usuario.model');

class ServiceError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function obtenerSecreto() {
  const secreto = process.env.JWT_SECRET;
  if (!secreto) {
    throw new ServiceError(500, 'El servidor no tiene configurado JWT_SECRET');
  }
  return secreto;
}

/**
 * Valida credenciales y emite un JWT (RNF-03: expira en JWT_EXPIRES_IN, máx. 8h).
 * No se distingue en el mensaje de error si falló el email o la contraseña, para no
 * filtrar qué correos existen.
 */
async function login({ email, password }) {
  if (!email || !password) {
    throw new ServiceError(400, 'Los campos "email" y "password" son obligatorios');
  }

  const usuario = await usuarioModel.findByEmailConHash(email);
  if (!usuario || !usuario.activo) {
    throw new ServiceError(401, 'Credenciales inválidas');
  }

  const coincide = await bcrypt.compare(password, usuario.password_hash);
  if (!coincide) {
    throw new ServiceError(401, 'Credenciales inválidas');
  }

  const token = jwt.sign({ rol: usuario.rol, nombre: usuario.nombre }, obtenerSecreto(), {
    subject: String(usuario.id),
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });

  return {
    token,
    usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
  };
}

function verificarToken(token) {
  return jwt.verify(token, obtenerSecreto());
}

module.exports = { ServiceError, login, verificarToken };
