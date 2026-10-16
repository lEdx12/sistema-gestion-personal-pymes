const authService = require('../services/auth.service');

function manejarError(res, err) {
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: 'Error interno del servidor' });
}

async function login(req, res) {
  try {
    const resultado = await authService.login(req.body);
    res.json(resultado);
  } catch (err) {
    manejarError(res, err);
  }
}

/** Logout: con JWT sin estado no hay nada que invalidar en el servidor — el cliente
 *  descarta el token. Este endpoint existe por simetría con /login y para que el
 *  frontend tenga una llamada explícita que hacer al cerrar sesión. */
function logout(req, res) {
  res.json({ message: 'Sesión cerrada' });
}

module.exports = { login, logout };
