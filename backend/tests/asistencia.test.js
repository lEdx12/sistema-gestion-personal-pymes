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
      nombre: 'Lucas',
      apellido: 'Morales',
      fecha_ingreso: '2026-01-01',
      cargo: 'Operario',
      sueldo_base: 480000,
    });
  empleadoId = res.body.id;
});

afterAll(async () => {
  await pool.query('DELETE FROM asistencia WHERE empleado_id = $1', [empleadoId]);
  await pool.query('DELETE FROM empleados WHERE id = $1', [empleadoId]);
  await pool.end();
});

describe('POST /api/asistencia/entrada', () => {
  it('registra el marcaje de entrada del día', async () => {
    const res = await request(app)
      .post('/api/asistencia/entrada')
      .set('Authorization', authHeader)
      .send({ empleado_id: empleadoId, fecha: '2026-03-02', hora_entrada: '08:00' });
    expect(res.status).toBe(201);
    expect(res.body.hora_entrada).toBe('08:00:00');
    expect(res.body.ausente).toBe(false);
  });

  it('rechaza un segundo marcaje de entrada para la misma fecha', async () => {
    const res = await request(app)
      .post('/api/asistencia/entrada')
      .set('Authorization', authHeader)
      .send({ empleado_id: empleadoId, fecha: '2026-03-02', hora_entrada: '08:05' });
    expect(res.status).toBe(409);
  });

  it('rechaza si falta un campo obligatorio', async () => {
    const res = await request(app)
      .post('/api/asistencia/entrada')
      .set('Authorization', authHeader)
      .send({ empleado_id: empleadoId, fecha: '2026-03-03' });
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/asistencia/:id/salida', () => {
  it('CP-11 (revisado): rechaza una hora de salida igual a la de entrada', async () => {
    const registro = await request(app)
      .get(`/api/asistencia?empleado_id=${empleadoId}`)
      .set('Authorization', authHeader);
    const id = registro.body[0].id;

    const res = await request(app)
      .put(`/api/asistencia/${id}/salida`)
      .set('Authorization', authHeader)
      .send({ hora_salida: '08:00' });
    expect(res.status).toBe(400);
  });

  it('marca la salida, calcula horas_trabajadas y la hora queda posterior a la de entrada', async () => {
    const registro = await request(app)
      .get(`/api/asistencia?empleado_id=${empleadoId}`)
      .set('Authorization', authHeader);
    const id = registro.body[0].id;

    const res = await request(app)
      .put(`/api/asistencia/${id}/salida`)
      .set('Authorization', authHeader)
      .send({ hora_salida: '17:30' });
    expect(res.status).toBe(200);
    expect(res.body.hora_salida).toBe('17:30:00');
    expect(Number(res.body.horas_trabajadas)).toBe(9.5);
  });

  it('permite una salida en cualquier hora para turnos nocturnos (cruza la medianoche)', async () => {
    const entrada = await request(app)
      .post('/api/asistencia/entrada')
      .set('Authorization', authHeader)
      .send({ empleado_id: empleadoId, fecha: '2026-03-08', hora_entrada: '22:00' });

    const res = await request(app)
      .put(`/api/asistencia/${entrada.body.id}/salida`)
      .set('Authorization', authHeader)
      .send({ hora_salida: '06:00' });
    expect(res.status).toBe(200);
    expect(Number(res.body.horas_trabajadas)).toBe(8);
  });
});

describe('PUT /api/asistencia/:id (edición)', () => {
  it('corrige la hora de entrada y recalcula horas_trabajadas', async () => {
    const listado = await request(app)
      .get(`/api/asistencia?empleado_id=${empleadoId}`)
      .set('Authorization', authHeader);
    const registro = listado.body.find((r) => r.fecha.startsWith('2026-03-08'));

    const res = await request(app)
      .put(`/api/asistencia/${registro.id}`)
      .set('Authorization', authHeader)
      .send({ hora_entrada: '21:00' });
    expect(res.status).toBe(200);
    expect(res.body.hora_entrada).toBe('21:00:00');
    expect(Number(res.body.horas_trabajadas)).toBe(9);
  });

  it('convierte un registro en ausencia con justificación, limpiando las horas', async () => {
    const listado = await request(app)
      .get(`/api/asistencia?empleado_id=${empleadoId}`)
      .set('Authorization', authHeader);
    const registro = listado.body.find((r) => r.fecha.startsWith('2026-03-08'));

    const res = await request(app)
      .put(`/api/asistencia/${registro.id}`)
      .set('Authorization', authHeader)
      .send({ ausente: true, justificacion: 'Error de tipeo, no trabajó ese día' });
    expect(res.status).toBe(200);
    expect(res.body.ausente).toBe(true);
    expect(res.body.hora_entrada).toBeNull();
    expect(res.body.hora_salida).toBeNull();
  });

  it('rechaza si no existe el registro', async () => {
    const res = await request(app)
      .put('/api/asistencia/999999')
      .set('Authorization', authHeader)
      .send({ hora_entrada: '08:00' });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/asistencia/resumen-semanal', () => {
  it('suma las horas trabajadas del rango y calcula la sobrejornada', async () => {
    const res = await request(app)
      .get('/api/asistencia/resumen-semanal')
      .set('Authorization', authHeader)
      .query({ empleado_id: empleadoId, desde: '2026-03-01', hasta: '2026-03-07' });
    expect(res.status).toBe(200);
    expect(res.body.totalHoras).toBe(9.5);
    expect(res.body.horasSobrejornada).toBe(0);
    expect(res.body.jornadaMaxHoras).toBe(45);
    expect(res.body.montoHorasExtra).toBe(0);
    expect(res.body.valorHoraOrdinaria).toBe(Math.round(480000 / 180));
  });

  it('rechaza si falta algún parámetro', async () => {
    const res = await request(app)
      .get('/api/asistencia/resumen-semanal')
      .set('Authorization', authHeader)
      .query({ empleado_id: empleadoId });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/asistencia/ausencia', () => {
  it('registra una ausencia con justificación', async () => {
    const res = await request(app)
      .post('/api/asistencia/ausencia')
      .set('Authorization', authHeader)
      .send({ empleado_id: empleadoId, fecha: '2026-03-04', justificacion: 'Licencia médica' });
    expect(res.status).toBe(201);
    expect(res.body.ausente).toBe(true);
  });

  it('rechaza una ausencia sin justificación', async () => {
    const res = await request(app)
      .post('/api/asistencia/ausencia')
      .set('Authorization', authHeader)
      .send({ empleado_id: empleadoId, fecha: '2026-03-05' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/asistencia', () => {
  it('filtra por empleado_id', async () => {
    const res = await request(app)
      .get(`/api/asistencia?empleado_id=${empleadoId}`)
      .set('Authorization', authHeader);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });
});
