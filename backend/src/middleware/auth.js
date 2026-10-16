const authService = require('../services/auth.service');

/**
 * Exige un JWT válido en el header "Authorization: Bearer <token>" y deja el usuario
 * decodificado en req.user. Reemplaza a mockAuth (Sprint 1) ahora que RF-01 está
 * implementado. No restringe por rol — eso es RF-02 (Sprint 3).
 */
function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const [tipo, token] = header.split(' ');

  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token de autenticación requerido' });
  }

  try {
    const payload = authService.verificarToken(token);
    req.user = { id: Number(payload.sub), nombre: payload.nombre, rol: payload.rol };
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

module.exports = auth;
