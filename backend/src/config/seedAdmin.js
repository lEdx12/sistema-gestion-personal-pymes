require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('./db');

/**
 * Crea (o actualiza la contraseña de) el usuario administrador inicial. Es necesario
 * porque RF-14 (CRUD de usuarios del sistema) todavía no existe — sin esto nadie
 * podría iniciar sesión por primera vez. Lee las credenciales desde .env en vez de
 * hardcodearlas, y se puede volver a ejecutar para rotar la contraseña.
 */
async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@pyme.cl';
  const nombre = process.env.ADMIN_NOMBRE || 'Administrador';
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    console.error('Defina ADMIN_PASSWORD en backend/.env antes de ejecutar "npm run seed:admin".');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await pool.query(
    `INSERT INTO usuarios (nombre, email, password_hash, rol, activo, debe_cambiar_password)
     VALUES ($1, $2, $3, 'administrador', TRUE, TRUE)
     ON CONFLICT (email) DO UPDATE
       SET password_hash = EXCLUDED.password_hash, nombre = EXCLUDED.nombre, activo = TRUE,
           debe_cambiar_password = TRUE`,
    [nombre, email, passwordHash],
  );

  console.log(`Usuario administrador listo: ${email}`);
  await pool.end();
}

seedAdmin().catch((err) => {
  console.error('Error al crear el usuario administrador:', err);
  process.exit(1);
});
