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
      nombre: 'Pilar',
      apellido: 'Reyes',
      fecha_ingreso: '2025-01-01',
      cargo: 'Diseñadora',
      sueldo_base: 500000,
    });
  empleadoId = res.body.id;

  await request(app)
    .post('/api/contratos')
    .set('Authorization', authHeader)
    .send({ empleado_id: empleadoId, tipo: 'indefinido', fecha_inicio: '2025-01-01' });

  for (const periodo of ['2026-01', '2026-02', '2026-03', '2026-04']) {
    await request(app)
      .post('/api/liquidaciones')
      .set('Authorization', authHeader)
      .send({ empleado_id: empleadoId, periodo });
  }
});

afterAll(async () => {
  await pool.query('DELETE FROM liquidaciones WHERE empleado_id = $1', [empleadoId]);
  await pool.query('DELETE FROM contratos WHERE empleado_id = $1', [empleadoId]);
  await pool.query('DELETE FROM empleados WHERE id = $1', [empleadoId]);
  await pool.end();
});

describe('GET /api/liquidaciones/historial', () => {
  it('sin filtro de fechas devuelve todo el historial del empleado', async () => {
    const res = await request(app)
      .get('/api/liquidaciones/historial')
      .set('Authorization', authHeader)
      .query({ empleado_id: empleadoId });

    expect(res.status).toBe(200);
    expect(res.body.empleado.rut).toBe(RUT_EMPLEADO);
    expect(res.body.cantidad).toBe(4);
    expect(res.body.liquidaciones).toHaveLength(4);
    expect(res.body.totalLiquido).toBe(res.body.liquidaciones.reduce((a, l) => a + Number(l.liquido_pagar), 0));
  });

  it('filtra por rango de períodos (desde/hasta)', async () => {
    const res = await request(app)
      .get('/api/liquidaciones/historial')
      .set('Authorization', authHeader)
      .query({ empleado_id: empleadoId, desde: '2026-02', hasta: '2026-03' });

    expect(res.status).toBe(200);
    expect(res.body.cantidad).toBe(2);
    const periodos = res.body.liquidaciones.map((l) => l.periodo).sort();
    expect(periodos).toEqual(['2026-02', '2026-03']);
  });

  it('calcula el promedio del líquido pagado en el rango', async () => {
    const res = await request(app)
      .get('/api/liquidaciones/historial')
      .set('Authorization', authHeader)
      .query({ empleado_id: empleadoId, desde: '2026-01', hasta: '2026-04' });

    expect(res.body.promedioLiquido).toBe(Math.round(res.body.totalLiquido / res.body.cantidad));
  });

  it('rechaza si falta empleado_id', async () => {
    const res = await request(app).get('/api/liquidaciones/historial').set('Authorization', authHeader);
    expect(res.status).toBe(400);
  });

  it('rechaza un formato de fecha inválido', async () => {
    const res = await request(app)
      .get('/api/liquidaciones/historial')
      .set('Authorization', authHeader)
      .query({ empleado_id: empleadoId, desde: '2026-1' });
    expect(res.status).toBe(400);
  });

  it('rechaza si "desde" es posterior a "hasta"', async () => {
    const res = await request(app)
      .get('/api/liquidaciones/historial')
      .set('Authorization', authHeader)
      .query({ empleado_id: empleadoId, desde: '2026-04', hasta: '2026-01' });
    expect(res.status).toBe(400);
  });

  it('rechaza si el empleado no existe', async () => {
    const res = await request(app)
      .get('/api/liquidaciones/historial')
      .set('Authorization', authHeader)
      .query({ empleado_id: 999999 });
    expect(res.status).toBe(404);
  });

  it('pagina las liquidaciones sin alterar los agregados (cantidad, totalLiquido)', async () => {
    const res = await request(app)
      .get('/api/liquidaciones/historial')
      .set('Authorization', authHeader)
      .query({ empleado_id: empleadoId, pagina: 1, por_pagina: 2 });

    expect(res.status).toBe(200);
    expect(res.body.liquidaciones).toHaveLength(2);
    expect(res.body.cantidad).toBe(4);
    expect(res.body.totalPaginas).toBe(2);
  });

  it('devuelve un historial vacío si no hay liquidaciones en el rango', async () => {
    const res = await request(app)
      .get('/api/liquidaciones/historial')
      .set('Authorization', authHeader)
      .query({ empleado_id: empleadoId, desde: '2025-01', hasta: '2025-12' });
    expect(res.status).toBe(200);
    expect(res.body.cantidad).toBe(0);
    expect(res.body.promedioLiquido).toBe(0);
  });
});
