-- Cambio obligatorio de contraseña en el primer inicio de sesión.
-- Por defecto TRUE: toda cuenta existente y futura empieza exigiendo el cambio,
-- hasta que el propio usuario defina su contraseña (ver usuarios.service.js).
ALTER TABLE usuarios ADD COLUMN debe_cambiar_password BOOLEAN NOT NULL DEFAULT TRUE;
