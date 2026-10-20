/**
 * Exige que req.user.rol esté entre los roles permitidos (RF-02). Debe montarse
 * después del middleware de autenticación (auth.js), que es el que llena req.user.
 */
function permitirRoles(...rolesPermitidos) {
  return (req, res, next) => {
    if (!rolesPermitidos.includes(req.user?.rol)) {
      return res.status(403).json({ error: 'No tiene permisos para esta acción' });
    }
    next();
  };
}

module.exports = { permitirRoles };
