const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../src/app');
const pool = require('../src/config/db');
const { obtenerAuthHeader } = require('./helpers/auth');
const { generarRutDePrueba } = require('./helpers/rut');

const RUT_EMPLEADO = generarRutDePrueba();
let empleadoId;
let authHeader;
const archivosSubidos = [];

beforeAll(async () => {
  authHeader = await obtenerAuthHeader();
  const res = await request(app)
    .post('/api/empleados')
    .set('Authorization', authHeader)
    .send({
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
  for (const archivo of archivosSubidos) {
    fs.rmSync(path.join(__dirname, '..', 'uploads', 'contratos', archivo), { force: true });
  }
  await pool.query('DELETE FROM contratos WHERE empleado_id = $1', [empleadoId]);
  await pool.query('DELETE FROM empleados WHERE id = $1', [empleadoId]);
  await pool.end();
});

describe('POST /api/contratos', () => {
  it('crea un contrato indefinido', async () => {
    const res = await request(app)
      .post('/api/contratos')
      .set('Authorization', authHeader)
      .send({ empleado_id: empleadoId, tipo: 'indefinido', fecha_inicio: '2026-01-01' });
    expect(res.status).toBe(201);
    expect(res.body.tipo).toBe('indefinido');
    expect(res.body.activo).toBe(true);
  });

  it('rechaza crear un segundo contrato mientras el primero esté activo', async () => {
    const res = await request(app)
      .post('/api/contratos')
      .set('Authorization', authHeader)
      .send({ empleado_id: empleadoId, tipo: 'indefinido', fecha_inicio: '2026-02-01' });
    expect(res.status).toBe(409);
  });

  it('rechaza plazo_fijo sin fecha_termino', async () => {
    const res = await request(app)
      .post('/api/contratos')
      .set('Authorization', authHeader)
      .send({
        empleado_id: empleadoId + 999,
        tipo: 'plazo_fijo',
        fecha_inicio: '2026-01-01',
      });
    expect(res.status).toBe(400);
  });

  it('rechaza plazo_fijo con fecha_termino anterior a fecha_inicio', async () => {
    const res = await request(app)
      .post('/api/contratos')
      .set('Authorization', authHeader)
      .send({
        empleado_id: empleadoId,
        tipo: 'plazo_fijo',
        fecha_inicio: '2026-03-01',
        fecha_termino: '2026-01-01',
      });
    expect(res.status).toBe(400);
  });

  it('rechaza si el empleado no existe', async () => {
    const res = await request(app)
      .post('/api/contratos')
      .set('Authorization', authHeader)
      .send({
        empleado_id: 999999,
        tipo: 'indefinido',
        fecha_inicio: '2026-01-01',
      });
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/contratos/:id/renovar', () => {
  it('cierra el contrato activo y crea uno nuevo a plazo fijo', async () => {
    const listado = await request(app)
      .get(`/api/contratos?empleado_id=${empleadoId}`)
      .set('Authorization', authHeader);
    const contratoActivo = listado.body.datos.find((c) => c.activo);

    const res = await request(app)
      .put(`/api/contratos/${contratoActivo.id}/renovar`)
      .set('Authorization', authHeader)
      .send({ tipo: 'plazo_fijo', fecha_inicio: '2026-06-01', fecha_termino: '2026-12-01' });

    expect(res.status).toBe(201);
    expect(res.body.tipo).toBe('plazo_fijo');
    expect(res.body.activo).toBe(true);

    const anterior = await request(app)
      .get(`/api/contratos/${contratoActivo.id}`)
      .set('Authorization', authHeader);
    expect(anterior.body.activo).toBe(false);
    expect(anterior.body.fecha_termino).toContain('2026-06-01');
  });
});

describe('GET /api/contratos', () => {
  it('filtra por empleado_id', async () => {
    const res = await request(app)
      .get(`/api/contratos?empleado_id=${empleadoId}`)
      .set('Authorization', authHeader);
    expect(res.status).toBe(200);
    expect(res.body.datos.length).toBeGreaterThanOrEqual(2);
    expect(res.body.datos.every((c) => c.empleado_id === empleadoId)).toBe(true);
  });

  it('pagina los resultados', async () => {
    const res = await request(app)
      .get(`/api/contratos?empleado_id=${empleadoId}&pagina=1&por_pagina=1`)
      .set('Authorization', authHeader);
    expect(res.body.datos).toHaveLength(1);
    expect(res.body.totalPaginas).toBeGreaterThanOrEqual(2);
  });
});

describe('POST /api/contratos/:id/documento', () => {
  it('sube un documento y actualiza documento_url', async () => {
    const listado = await request(app)
      .get(`/api/contratos?empleado_id=${empleadoId}`)
      .set('Authorization', authHeader);
    const contrato = listado.body.datos[0];

    const res = await request(app)
      .post(`/api/contratos/${contrato.id}/documento`)
      .set('Authorization', authHeader)
      .attach('documento', Buffer.from('contenido de prueba'), {
        filename: 'contrato.pdf',
        contentType: 'application/pdf',
      });

    expect(res.status).toBe(200);
    expect(res.body.documento_url).toMatch(/^\/uploads\/contratos\/contrato-/);
    archivosSubidos.push(path.basename(res.body.documento_url));
  });

  it('rechaza un tipo de archivo no permitido', async () => {
    const listado = await request(app)
      .get(`/api/contratos?empleado_id=${empleadoId}`)
      .set('Authorization', authHeader);
    const contrato = listado.body.datos[0];

    const res = await request(app)
      .post(`/api/contratos/${contrato.id}/documento`)
      .set('Authorization', authHeader)
      .attach('documento', Buffer.from('contenido'), {
        filename: 'archivo.exe',
        contentType: 'application/octet-stream',
      });

    expect(res.status).toBe(400);
  });

  it('rechaza si no se envía ningún archivo', async () => {
    const listado = await request(app)
      .get(`/api/contratos?empleado_id=${empleadoId}`)
      .set('Authorization', authHeader);
    const contrato = listado.body.datos[0];

    const res = await request(app)
      .post(`/api/contratos/${contrato.id}/documento`)
      .set('Authorization', authHeader);
    expect(res.status).toBe(400);
  });

  it('rechaza si el contrato no existe', async () => {
    const res = await request(app)
      .post('/api/contratos/999999/documento')
      .set('Authorization', authHeader)
      .attach('documento', Buffer.from('contenido'), {
        filename: 'contrato.pdf',
        contentType: 'application/pdf',
      });
    expect(res.status).toBe(404);

    const dirContratos = path.join(__dirname, '..', 'uploads', 'contratos');
    for (const archivo of fs.readdirSync(dirContratos)) {
      if (archivo.startsWith('contrato-999999-')) archivosSubidos.push(archivo);
    }
  });
});
