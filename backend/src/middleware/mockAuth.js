// Sprint 1: usuario administrador de prueba hardcodeado (sin JWT todavía).
// RF-01 lo reemplaza en Sprint 2 con autenticación real.
function mockAuth(req, res, next) {
  req.user = { id: 0, nombre: 'Admin de Prueba', rol: 'administrador' };
  next();
}

module.exports = mockAuth;
