const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');

const RUT_EMPLEADO = '12345678-5';
let empleadoId;

beforeAll(async () => {
  await pool.query('DELETE FROM empleados WHERE rut = $1', [RUT_EMPLEADO]);
  const res = await request(app).post('/api/empleados').send({
    rut: RUT_EMPLEADO,
    nombre: 'Marcela',
    apellido: 'Fuentes',
    fecha_ingreso: '2026-01-01',
    cargo: 'Analista',
    sueldo_base: 700000,
  });
  empleadoId = res.body.id;
});

afterAll(async () => {
  await pool.query('DELETE FROM contratos WHERE empleado_id = $1', [empleadoId]);
  await pool.query('DELETE FROM empleados WHERE id = $1', [empleadoId]);
  await pool.end();
});

describe('POST /api/contratos', () => {
  it('crea un contrato indefinido', async () => {
    const res = await request(app)
      .post('/api/contratos')
      .send({ empleado_id: empleadoId, tipo: 'indefinido', fecha_inicio: '2026-01-01' });
    expect(res.status).toBe(201);
    expect(res.body.tipo).toBe('indefinido');
    expect(res.body.activo).toBe(true);
  });

  it('rechaza crear un segundo contrato mientras el primero esté activo', async () => {
    const res = await request(app)
      .post('/api/contratos')
      .send({ empleado_id: empleadoId, tipo: 'indefinido', fecha_inicio: '2026-02-01' });
    expect(res.status).toBe(409);
  });

  it('rechaza plazo_fijo sin fecha_termino', async () => {
    const res = await request(app).post('/api/contratos').send({
      empleado_id: empleadoId + 999,
      tipo: 'plazo_fijo',
      fecha_inicio: '2026-01-01',
    });
    expect(res.status).toBe(400);
  });

  it('rechaza plazo_fijo con fecha_termino anterior a fecha_inicio', async () => {
    const res = await request(app).post('/api/contratos').send({
      empleado_id: empleadoId,
      tipo: 'plazo_fijo',
      fecha_inicio: '2026-03-01',
      fecha_termino: '2026-01-01',
    });
    expect(res.status).toBe(400);
  });

  it('rechaza si el empleado no existe', async () => {
    const res = await request(app).post('/api/contratos').send({
      empleado_id: 999999,
      tipo: 'indefinido',
      fecha_inicio: '2026-01-01',
    });
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/contratos/:id/renovar', () => {
  it('cierra el contrato activo y crea uno nuevo a plazo fijo', async () => {
    const listado = await request(app).get(`/api/contratos?empleado_id=${empleadoId}`);
    const contratoActivo = listado.body.find((c) => c.activo);

    const res = await request(app)
      .put(`/api/contratos/${contratoActivo.id}/renovar`)
      .send({ tipo: 'plazo_fijo', fecha_inicio: '2026-06-01', fecha_termino: '2026-12-01' });

    expect(res.status).toBe(201);
    expect(res.body.tipo).toBe('plazo_fijo');
    expect(res.body.activo).toBe(true);

    const anterior = await request(app).get(`/api/contratos/${contratoActivo.id}`);
    expect(anterior.body.activo).toBe(false);
    expect(anterior.body.fecha_termino).toContain('2026-06-01');
  });
});

describe('GET /api/contratos', () => {
  it('filtra por empleado_id', async () => {
    const res = await request(app).get(`/api/contratos?empleado_id=${empleadoId}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    expect(res.body.every((c) => c.empleado_id === empleadoId)).toBe(true);
  });
});
