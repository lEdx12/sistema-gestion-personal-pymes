const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');
const { obtenerAuthHeader } = require('./helpers/auth');
const { generarRutDePrueba } = require('./helpers/rut');

const RUT_EMPLEADO = generarRutDePrueba();
let empleadoId;
let authHeader;

beforeAll(async () => {
  authHeader = await obtenerAuthHeader();
  const res = await request(app)
    .post('/api/empleados')
    .set('Authorization', authHeader)
    .send({
      rut: RUT_EMPLEADO,
      nombre: 'Noemi',
      apellido: 'Salas',
      fecha_ingreso: '2025-01-01',
      cargo: 'Operaria',
      sueldo_base: 480000,
    });
  empleadoId = res.body.id;

  // 4 días trabajados de 9h (lun-jue de la primera semana del período) + 1 ausencia.
  const dias = ['2026-05-04', '2026-05-05', '2026-05-06', '2026-05-07'];
  for (const fecha of dias) {
    const entrada = await request(app)
      .post('/api/asistencia/entrada')
      .set('Authorization', authHeader)
      .send({ empleado_id: empleadoId, fecha, hora_entrada: '08:00' });
    await request(app)
      .put(`/api/asistencia/${entrada.body.id}/salida`)
      .set('Authorization', authHeader)
      .send({ hora_salida: '17:00' });
  }
  await request(app)
    .post('/api/asistencia/ausencia')
    .set('Authorization', authHeader)
    .send({ empleado_id: empleadoId, fecha: '2026-05-08', justificacion: 'Licencia médica' });
});

afterAll(async () => {
  await pool.query('DELETE FROM asistencia WHERE empleado_id = $1', [empleadoId]);
  await pool.query('DELETE FROM empleados WHERE id = $1', [empleadoId]);
  await pool.end();
});

describe('GET /api/asistencia/reporte-mensual (individual)', () => {
  it('devuelve el resumen y el detalle de un empleado para el período', async () => {
    const res = await request(app)
      .get('/api/asistencia/reporte-mensual')
      .set('Authorization', authHeader)
      .query({ empleado_id: empleadoId, periodo: '2026-05' });

    expect(res.status).toBe(200);
    expect(res.body.empleado.rut).toBe(RUT_EMPLEADO);
    expect(res.body.diasTrabajados).toBe(4);
    expect(res.body.diasAusentes).toBe(1);
    expect(res.body.totalHoras).toBe(36); // 4 * 9h
    expect(res.body.horasSobrejornada).toBe(0); // 36h < 45h
    expect(res.body.registros).toHaveLength(5);
  });

  it('rechaza un período con formato inválido', async () => {
    const res = await request(app)
      .get('/api/asistencia/reporte-mensual')
      .set('Authorization', authHeader)
      .query({ empleado_id: empleadoId, periodo: '2026-5' });
    expect(res.status).toBe(400);
  });

  it('rechaza si el empleado no existe', async () => {
    const res = await request(app)
      .get('/api/asistencia/reporte-mensual')
      .set('Authorization', authHeader)
      .query({ empleado_id: 999999, periodo: '2026-05' });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/asistencia/reporte-mensual (consolidado)', () => {
  it('sin empleado_id devuelve el consolidado de todos los empleados activos', async () => {
    const res = await request(app)
      .get('/api/asistencia/reporte-mensual')
      .set('Authorization', authHeader)
      .query({ periodo: '2026-05' });

    expect(res.status).toBe(200);
    expect(res.body.periodo).toBe('2026-05');
    expect(Array.isArray(res.body.empleados)).toBe(true);

    const fila = res.body.empleados.find((e) => e.empleado_id === empleadoId);
    expect(fila).toBeTruthy();
    expect(fila.diasTrabajados).toBe(4);
    expect(fila.diasAusentes).toBe(1);
    expect(fila.totalHoras).toBe(36);
  });
});

describe('GET /api/asistencia/reporte-mensual/pdf', () => {
  it('descarga el PDF del reporte individual', async () => {
    const res = await request(app)
      .get('/api/asistencia/reporte-mensual/pdf')
      .set('Authorization', authHeader)
      .query({ empleado_id: empleadoId, periodo: '2026-05' });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toContain('attachment');
    expect(res.headers['content-disposition']).toContain(RUT_EMPLEADO);
    expect(res.body.slice(0, 4).toString()).toBe('%PDF');
  });

  it('descarga el PDF del reporte consolidado', async () => {
    const res = await request(app)
      .get('/api/asistencia/reporte-mensual/pdf')
      .set('Authorization', authHeader)
      .query({ periodo: '2026-05' });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toContain('consolidado');
    expect(res.body.slice(0, 4).toString()).toBe('%PDF');
  });

  it('rechaza si el empleado no existe', async () => {
    const res = await request(app)
      .get('/api/asistencia/reporte-mensual/pdf')
      .set('Authorization', authHeader)
      .query({ empleado_id: 999999, periodo: '2026-05' });
    expect(res.status).toBe(404);
  });
});
