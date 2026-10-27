/**
 * Script de datos de demostración: "Restaurante Los Fogones", 12 empleados usando el
 * sistema en producción desde agosto de 2026 hasta hoy. Pensado para probar a mano
 * todas las funcionalidades (empleados, contratos, asistencia, horas extra,
 * liquidaciones, documentos, alertas, roles) con datos coherentes de un solo negocio,
 * no con los fixtures sueltos que fueron quedando de pruebas manuales anteriores.
 *
 * Uso: node scripts/seedRestaurante.js
 *
 * No es parte de los tests automáticos ni de las migraciones — es una herramienta de
 * desarrollo que se corre a mano una vez. Usa los *services* reales (no inserta SQL a
 * mano) para que toda la data pase por las mismas reglas de negocio que usaría un
 * usuario real desde el frontend.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../src/config/db');
const empleadosService = require('../src/services/empleados.service');
const contratosService = require('../src/services/contratos.service');
const asistenciaService = require('../src/services/asistencia.service');
const liquidacionesService = require('../src/services/liquidaciones.service');
const documentosService = require('../src/services/documentos.service');
const usuariosService = require('../src/services/usuarios.service');
const alertasService = require('../src/services/alertas.service');
const { calcularDigitoVerificador } = require('../src/utils/rut');

const INICIO_DATOS = new Date('2026-08-01');
const AYER = new Date('2026-10-26');

function rut(cuerpo) {
  const c = String(cuerpo);
  return `${c}-${calcularDigitoVerificador(c)}`;
}

function iso(d) {
  return d.toISOString().slice(0, 10);
}

function agregarDias(d, n) {
  const r = new Date(d);
  r.setUTCDate(r.getUTCDate() + n);
  return r;
}

function maxFecha(a, b) {
  return a > b ? a : b;
}

const JUSTIFICACIONES = [
  'Licencia médica',
  'Permiso personal',
  'Control médico de hijo/a',
  'Trámite personal urgente',
];

/** Horario según el grupo de trabajo; viernes y sábado (servicio fuerte) se extienden. */
function turnoDelDia(grupo, diaSemana) {
  const esFinde = diaSemana === 5 || diaSemana === 6;
  const TURNOS = {
    cocina: esFinde ? ['09:00', '19:00'] : ['09:00', '17:00'],
    sala: esFinde ? ['12:00', '22:00'] : ['12:00', '20:00'],
    admin: esFinde ? ['09:00', '19:00'] : ['09:00', '17:30'],
    delivery: esFinde ? ['13:00', '21:00'] : ['13:00', '20:00'],
  };
  return TURNOS[grupo];
}

const EMPLEADOS = [
  {
    rut: rut(15234567), nombre: 'Francisco Javier', apellido: 'Muñoz',
    fecha_nacimiento: '1988-04-12', direccion: 'Av. Independencia 1450, Independencia',
    telefono: '+56912345671', email: 'francisco.munoz@losfogones.cl',
    fecha_ingreso: '2026-01-15', cargo: 'Chef Ejecutivo', sueldo_base: 950000,
    grupo: 'cocina', contrato: { tipo: 'indefinido' },
  },
  {
    rut: rut(17345678), nombre: 'María José', apellido: 'Fernández',
    fecha_nacimiento: '1997-07-22', direccion: 'Santa Filomena 230, Recoleta',
    telefono: '+56912345672', email: 'maria.fernandez@losfogones.cl',
    fecha_ingreso: '2026-02-01', cargo: 'Cocinera', sueldo_base: 650000,
    grupo: 'cocina', contrato: { tipo: 'indefinido' },
  },
  {
    rut: rut(16456789), nombre: 'Pedro Pablo', apellido: 'Araya',
    fecha_nacimiento: '1992-11-03', direccion: 'Av. Matta 890, Santiago',
    telefono: '+56912345673', email: 'pedro.araya@losfogones.cl',
    fecha_ingreso: '2026-03-10', cargo: 'Cocinero', sueldo_base: 650000,
    grupo: 'cocina', contrato: { tipo: 'indefinido' },
  },
  {
    rut: rut(19567890), nombre: 'Ignacio Andrés', apellido: 'Cárdenas',
    fecha_nacimiento: '2004-02-18', direccion: 'Pasaje Las Rosas 45, Quinta Normal',
    telefono: '+56912345674', email: 'ignacio.cardenas@losfogones.cl',
    fecha_ingreso: '2026-06-01', cargo: 'Ayudante de Cocina', sueldo_base: 520000,
    grupo: 'cocina', contrato: { tipo: 'plazo_fijo', fecha_termino: '2026-11-15' },
  },
  {
    rut: rut(14678901), nombre: 'Rosa Elena', apellido: 'Huenchumán',
    fecha_nacimiento: '1981-09-30', direccion: 'Av. Conchalí 560, Conchalí',
    telefono: '+56912345675', email: 'rosa.huenchuman@losfogones.cl',
    fecha_ingreso: '2026-01-15', cargo: 'Lavaplatos', sueldo_base: 500000,
    grupo: 'cocina', contrato: { tipo: 'indefinido' },
  },
  {
    rut: rut(18789012), nombre: 'Matías Ignacio', apellido: 'Vergara',
    fecha_nacimiento: '2002-05-14', direccion: 'Catedral 2100, Santiago',
    telefono: '+56912345676', email: 'matias.vergara@losfogones.cl',
    fecha_ingreso: '2026-02-15', cargo: 'Garzón', sueldo_base: 540000,
    grupo: 'sala', contrato: { tipo: 'indefinido' },
  },
  {
    rut: rut(19890123), nombre: 'Camila Antonia', apellido: 'Reyes',
    fecha_nacimiento: '2005-01-27', direccion: 'Av. Ricardo Cumming 780, Santiago',
    telefono: '+56912345677', email: 'camila.reyes@losfogones.cl',
    fecha_ingreso: '2026-05-01', cargo: 'Garzón', sueldo_base: 540000,
    grupo: 'sala', contrato: { tipo: 'indefinido' },
  },
  {
    rut: rut(17901234), nombre: 'Jorge Luis', apellido: 'Espinoza',
    fecha_nacimiento: '1996-08-09', direccion: 'Av. Walker Martínez 300, La Florida',
    telefono: '+56912345678', email: 'jorge.espinoza@losfogones.cl',
    fecha_ingreso: '2026-08-01', cargo: 'Garzón', sueldo_base: 540000,
    grupo: 'sala', contrato: { tipo: 'plazo_fijo', fecha_termino: '2027-02-01' },
  },
  {
    rut: rut(18012345), nombre: 'Valentina Isidora', apellido: 'Morales',
    fecha_nacimiento: '1999-12-05', direccion: 'San Pablo 3400, Quinta Normal',
    telefono: '+56912345679', email: 'valentina.morales@losfogones.cl',
    fecha_ingreso: '2026-02-01', cargo: 'Cajera', sueldo_base: 560000,
    grupo: 'sala', contrato: { tipo: 'indefinido' },
  },
  {
    rut: rut(16123456), nombre: 'Diego Alejandro', apellido: 'Castro',
    fecha_nacimiento: '1994-03-21', direccion: 'Av. Brasil 950, Santiago',
    telefono: '+56912345680', email: 'diego.castro@losfogones.cl',
    fecha_ingreso: '2026-04-01', cargo: 'Bartender', sueldo_base: 580000,
    grupo: 'sala', contrato: { tipo: 'indefinido' },
  },
  {
    rut: rut(15345678), nombre: 'Carolina Andrea', apellido: 'Silva',
    fecha_nacimiento: '1990-06-17', direccion: 'Huérfanos 1234, Santiago',
    telefono: '+56912345681', email: 'carolina.silva@losfogones.cl',
    fecha_ingreso: '2026-01-15', cargo: 'Supervisora de Turno', sueldo_base: 750000,
    grupo: 'admin', contrato: { tipo: 'indefinido' },
  },
  {
    rut: rut(20123456), nombre: 'Nicolás Esteban', apellido: 'Pizarro',
    fecha_nacimiento: '2006-10-02', direccion: 'Av. Independencia 2200, Independencia',
    telefono: '+56912345682', email: 'nicolas.pizarro@losfogones.cl',
    fecha_ingreso: '2026-09-01', cargo: 'Repartidor', sueldo_base: 500000,
    grupo: 'delivery', contrato: { tipo: 'plazo_fijo', fecha_termino: '2026-12-01' },
  },
];

/** Borra los empleados que había antes (y todo lo que cuelga de ellos) para partir limpio. */
async function limpiarDatosAnteriores() {
  const { rows } = await pool.query('SELECT id FROM empleados');
  const ids = rows.map((r) => r.id);
  if (ids.length === 0) return;

  const { rows: docs } = await pool.query('SELECT url FROM documentos WHERE empleado_id = ANY($1)', [ids]);
  for (const { url } of docs) {
    if (url?.startsWith('/uploads/documentos/')) {
      fs.rmSync(path.join(__dirname, '..', 'uploads', 'documentos', path.basename(url)), { force: true });
    }
  }
  const { rows: liqs } = await pool.query(
    'SELECT pdf_url FROM liquidaciones WHERE empleado_id = ANY($1) AND pdf_url IS NOT NULL',
    [ids],
  );
  for (const { pdf_url: pdfUrl } of liqs) {
    fs.rmSync(path.join(__dirname, '..', 'uploads', 'liquidaciones', path.basename(pdfUrl)), { force: true });
  }
  const { rows: contratosConDoc } = await pool.query(
    'SELECT documento_url FROM contratos WHERE empleado_id = ANY($1) AND documento_url IS NOT NULL',
    [ids],
  );
  for (const { documento_url: docUrl } of contratosConDoc) {
    fs.rmSync(path.join(__dirname, '..', 'uploads', 'contratos', path.basename(docUrl)), { force: true });
  }

  await pool.query('DELETE FROM documentos WHERE empleado_id = ANY($1)', [ids]);
  await pool.query('DELETE FROM alertas WHERE empleado_id = ANY($1)', [ids]);
  await pool.query('DELETE FROM liquidaciones WHERE empleado_id = ANY($1)', [ids]);
  await pool.query('DELETE FROM asistencia WHERE empleado_id = ANY($1)', [ids]);
  await pool.query('DELETE FROM contratos WHERE empleado_id = ANY($1)', [ids]);
  await pool.query('DELETE FROM empleados WHERE id = ANY($1)', [ids]);
  console.log(`Limpieza: ${ids.length} empleado(s) anterior(es) eliminados (con sus contratos/asistencia/liquidaciones/documentos).`);
}

/** Genera asistencia entre `desde` y `hasta` (incl.), cerrado los lunes, con un par de ausencias. */
async function generarAsistencia(empleadoId, grupo, desde, hasta, indiceEmpleado) {
  const abiertos = [];
  let cursor = new Date(desde);
  while (cursor <= hasta) {
    if (cursor.getUTCDay() !== 1) abiertos.push(new Date(cursor)); // cerrado los lunes
    cursor = agregarDias(cursor, 1);
  }

  // 2 ausencias por empleado (si hay suficientes días), repartidas en el período.
  const indicesAusencia = new Set();
  if (abiertos.length > 12) indicesAusencia.add(Math.floor(abiertos.length * 0.3));
  if (abiertos.length > 25) indicesAusencia.add(Math.floor(abiertos.length * 0.7));

  let generados = 0;
  for (let i = 0; i < abiertos.length; i++) {
    const fecha = iso(abiertos[i]);
    if (indicesAusencia.has(i)) {
      await asistenciaService.registrarAusencia({
        empleado_id: empleadoId,
        fecha,
        justificacion: JUSTIFICACIONES[(indiceEmpleado + i) % JUSTIFICACIONES.length],
      });
      continue;
    }
    const [entrada, salida] = turnoDelDia(grupo, abiertos[i].getUTCDay());
    const registro = await asistenciaService.registrarEntrada({
      empleado_id: empleadoId,
      fecha,
      hora_entrada: entrada,
    });
    await asistenciaService.registrarSalida(registro.id, { hora_salida: salida });
    generados++;
  }
  return generados + indicesAusencia.size;
}

async function main() {
  await limpiarDatosAnteriores();

  const creados = [];
  for (const [indice, datos] of EMPLEADOS.entries()) {
    const { grupo, contrato, ...datosEmpleado } = datos;
    const empleado = await empleadosService.crearEmpleado(datosEmpleado);
    const fechaInicioContrato = empleado.fecha_ingreso.toISOString
      ? iso(empleado.fecha_ingreso)
      : empleado.fecha_ingreso;
    await contratosService.crearContrato({
      empleado_id: empleado.id,
      tipo: contrato.tipo,
      fecha_inicio: fechaInicioContrato,
      fecha_termino: contrato.fecha_termino,
    });

    const desde = maxFecha(INICIO_DATOS, new Date(datos.fecha_ingreso));
    const diasGenerados = await generarAsistencia(empleado.id, grupo, desde, AYER, indice);
    console.log(`✓ ${empleado.nombre} ${empleado.apellido} (#${empleado.id}, ${datos.cargo}) — ${diasGenerados} días de asistencia`);

    creados.push({ ...datos, id: empleado.id, grupo });
  }

  // Liquidaciones de los meses ya cerrados (agosto y septiembre). Octubre queda sin
  // generar a propósito, para poder probar "Generar liquidación" y la descarga del PDF
  // con datos reales desde el frontend.
  let totalLiquidaciones = 0;
  for (const empleado of creados) {
    for (const periodo of ['2026-08', '2026-09']) {
      if (new Date(empleado.fecha_ingreso) > new Date(`${periodo}-28`)) continue; // no trabajaba ese mes
      await liquidacionesService.generarLiquidacion({ empleado_id: empleado.id, periodo, generado_por: null });
      totalLiquidaciones++;
    }
  }
  console.log(`✓ ${totalLiquidaciones} liquidaciones generadas (agosto y septiembre; octubre queda pendiente).`);

  // Un par de documentos de ejemplo (RF-11).
  const chef = creados[0];
  const supervisora = creados[10];
  await documentosService.subirDocumento(
    chef.id,
    { buffer: Buffer.from('Certificado de antecedentes - documento de prueba'), originalname: 'certificado_antecedentes.pdf', mimetype: 'application/pdf' },
    { tipo: 'certificado de antecedentes' },
  );
  await documentosService.subirDocumento(
    supervisora.id,
    { buffer: Buffer.from('Contrato firmado - documento de prueba'), originalname: 'contrato_firmado.pdf', mimetype: 'application/pdf' },
    { tipo: 'contrato firmado' },
  );
  console.log('✓ 2 documentos de ejemplo subidos.');

  // Usuario Gerente del restaurante (además del Administrador ya existente), para
  // probar la diferencia de roles (RF-02) con una cuenta nueva (primer login pendiente).
  const EMAIL_GERENTE = 'patricia.duenas@losfogones.cl';
  const PASSWORD_GERENTE_TEMPORAL = 'Fogones2026!';
  const gerenteExistente = await pool.query('SELECT id FROM usuarios WHERE email = $1', [EMAIL_GERENTE]);
  if (gerenteExistente.rows.length === 0) {
    await usuariosService.crearUsuario({
      nombre: 'Patricia Dueñas',
      email: EMAIL_GERENTE,
      password: PASSWORD_GERENTE_TEMPORAL,
      rol: 'gerente',
    });
    console.log(`✓ Usuario Gerente creado: ${EMAIL_GERENTE} / ${PASSWORD_GERENTE_TEMPORAL} (pide cambiar la clave al entrar).`);
  } else {
    console.log(`– Usuario Gerente ${EMAIL_GERENTE} ya existía, no se tocó.`);
  }

  // RF-05: genera las alertas reales a partir de los contratos recién creados (debería
  // detectar al menos el de Ignacio Cárdenas, que vence el 2026-11-15).
  const alertas = await alertasService.generarAlertasVencimiento();
  console.log(`✓ ${alertas.length} alerta(s) de vencimiento de contrato generada(s).`);

  console.log('\nListo. 12 empleados de "Restaurante Los Fogones" cargados con contratos,');
  console.log('asistencia desde agosto, liquidaciones de agosto/septiembre, documentos y alertas.');
  await pool.end();
}

main().catch((err) => {
  console.error('Error al generar los datos de demostración:', err);
  process.exit(1);
});
