const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');
const { obtenerAuthHeader } = require('./helpers/auth');
const { generarRutDePrueba } = require('./helpers/rut');

const RUT_PRUEBA_NORMALIZADO = generarRutDePrueba();
const RUT_SIN_NOMBRE = generarRutDePrueba();
const RUT_DESACTIVAR = generarRutDePrueba();

const empleadoValido = {
  rut: RUT_PRUEBA_NORMALIZADO,
  nombre: 'Juana',
  apellido: 'Pérez',
  fecha_ingreso: '2026-01-15',
  cargo: 'Vendedora',
  sueldo_base: 500000,
};

let authHeader;

beforeAll(async () => {
  authHeader = await obtenerAuthHeader();
});

afterAll(async () => {
  await pool.query('DELETE FROM empleados WHERE rut = $1', [RUT_PRUEBA_NORMALIZADO]);
  await pool.end();
});

describe('POST /api/empleados', () => {
  it('crea un empleado con datos válidos', async () => {
    const res = await request(app)
      .post('/api/empleados')
      .set('Authorization', authHeader)
      .send(empleadoValido);
    expect(res.status).toBe(201);
    expect(res.body.rut).toBe(RUT_PRUEBA_NORMALIZADO);
    expect(res.body.activo).toBe(true);
  });

  it('CP-03: rechaza un RUT duplicado con "Empleado ya registrado"', async () => {
    const res = await request(app)
      .post('/api/empleados')
      .set('Authorization', authHeader)
      .send(empleadoValido);
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Empleado ya registrado');
  });

  it('rechaza un RUT inválido', async () => {
    const res = await request(app)
      .post('/api/empleados')
      .set('Authorization', authHeader)
      .send({ ...empleadoValido, rut: '11.111.111-2' });
    expect(res.status).toBe(400);
  });

  it('rechaza si falta un campo obligatorio', async () => {
    const { nombre: _nombre, ...sinNombre } = empleadoValido;
    const res = await request(app)
      .post('/api/empleados')
      .set('Authorization', authHeader)
      .send({ ...sinNombre, rut: RUT_SIN_NOMBRE });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/empleados', () => {
  it('lista solo empleados activos por defecto', async () => {
    const res = await request(app)
      .get('/api/empleados')
      .set('Authorization', authHeader)
      .query({ texto: RUT_PRUEBA_NORMALIZADO });
    expect(res.status).toBe(200);
    expect(res.body.datos.find((e) => e.rut === RUT_PRUEBA_NORMALIZADO)).toBeTruthy();
  });
});

describe('GET /api/empleados — filtros y paginación', () => {
  const RUT_PAGINA_1 = generarRutDePrueba();
  const RUT_PAGINA_2 = generarRutDePrueba();
  const CARGO_COMPARTIDO = `Repartidor-${Date.now()}`;

  beforeAll(async () => {
    for (const rut of [RUT_PAGINA_1, RUT_PAGINA_2]) {
      await request(app)
        .post('/api/empleados')
        .set('Authorization', authHeader)
        .send({ ...empleadoValido, rut, cargo: CARGO_COMPARTIDO });
    }
  });

  afterAll(async () => {
    await pool.query('DELETE FROM empleados WHERE rut = ANY($1)', [[RUT_PAGINA_1, RUT_PAGINA_2]]);
  });

  it('filtra por texto (busca en rut/nombre/apellido/cargo)', async () => {
    const res = await request(app)
      .get('/api/empleados')
      .set('Authorization', authHeader)
      .query({ texto: CARGO_COMPARTIDO });
    expect(res.status).toBe(200);
    expect(res.body.datos).toHaveLength(2);
    expect(res.body.total).toBe(2);
  });

  it('pagina los resultados filtrados', async () => {
    const pagina1 = await request(app)
      .get('/api/empleados')
      .set('Authorization', authHeader)
      .query({ texto: CARGO_COMPARTIDO, pagina: 1, por_pagina: 1 });
    expect(pagina1.body.datos).toHaveLength(1);
    expect(pagina1.body.total).toBe(2);
    expect(pagina1.body.totalPaginas).toBe(2);

    const pagina2 = await request(app)
      .get('/api/empleados')
      .set('Authorization', authHeader)
      .query({ texto: CARGO_COMPARTIDO, pagina: 2, por_pagina: 1 });
    expect(pagina2.body.datos).toHaveLength(1);
    expect(pagina2.body.datos[0].rut).not.toBe(pagina1.body.datos[0].rut);
  });
});

describe('GET /api/empleados/selector', () => {
  it('lista id/rut/nombre/apellido sin datos sensibles (sueldo, dirección, etc.)', async () => {
    const res = await request(app).get('/api/empleados/selector').set('Authorization', authHeader);
    expect(res.status).toBe(200);
    const fila = res.body.find((e) => e.rut === RUT_PRUEBA_NORMALIZADO);
    expect(fila).toEqual({ id: expect.any(Number), rut: RUT_PRUEBA_NORMALIZADO, nombre: 'Juana', apellido: 'Pérez' });
  });
});

describe('PUT /api/empleados/:id/desactivar', () => {
  it('desactiva un empleado existente', async () => {
    const creado = await request(app)
      .post('/api/empleados')
      .set('Authorization', authHeader)
      .send({ ...empleadoValido, rut: RUT_DESACTIVAR });
    const res = await request(app)
      .put(`/api/empleados/${creado.body.id}/desactivar`)
      .set('Authorization', authHeader);
    expect(res.status).toBe(200);
    expect(res.body.activo).toBe(false);

    const reactivado = await request(app)
      .put(`/api/empleados/${creado.body.id}/reactivar`)
      .set('Authorization', authHeader);
    expect(reactivado.status).toBe(200);
    expect(reactivado.body.activo).toBe(true);

    const listado = await request(app)
      .get('/api/empleados')
      .set('Authorization', authHeader)
      .query({ texto: RUT_DESACTIVAR });
    expect(listado.body.datos.find((e) => e.rut === RUT_DESACTIVAR)).toBeTruthy();

    await pool.query('DELETE FROM empleados WHERE rut = $1', [RUT_DESACTIVAR]);
  });

  it('rechaza reactivar un empleado inexistente', async () => {
    const res = await request(app)
      .put('/api/empleados/999999/reactivar')
      .set('Authorization', authHeader);
    expect(res.status).toBe(404);
  });
});
