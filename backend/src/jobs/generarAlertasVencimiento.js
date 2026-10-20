require('dotenv').config();
const pool = require('../config/db');
const { generarAlertasVencimiento } = require('../services/alertas.service');

/**
 * RF-05: job diario que revisa los contratos a plazo fijo próximos a vencer y
 * genera sus alertas. No usa un scheduler en memoria (node-cron) para no acoplar el
 * proceso web a la ejecución del job ni duplicarlo si hay más de una instancia del
 * servidor corriendo; en su lugar, este script se invoca desde un scheduler externo
 * (Render Cron Jobs, Railway Cron, o un crontab del sistema) una vez al día — ver
 * backend/README.md.
 */
async function main() {
  const generadas = await generarAlertasVencimiento();
  console.log(`Alertas de vencimiento generadas: ${generadas.length}`);
  await pool.end();
}

main().catch((err) => {
  console.error('Error al generar alertas de vencimiento:', err);
  process.exit(1);
});
