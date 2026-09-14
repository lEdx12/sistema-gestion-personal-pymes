const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');

const RUT_PRUEBA = '12.345.678-5';
const RUT_PRUEBA_NORMALIZADO = '12345678-5';

const empleadoValido = {
  rut: RUT_PRUEBA,
  nombre: 'Juana',
  apellido: 'Pérez',
  fecha_ingreso: '2026-01-15',
  cargo: 'Vendedora',
  sueldo_base: 500000,
};

beforeAll(async () => {
  await pool.query('DELETE FROM empleados WHERE rut = $1', [RUT_PRUEBA_NORMALIZADO]);
});

afterAll(async () => {
  await pool.query('DELETE FROM empleados WHERE rut = $1', [RUT_PRUEBA_NORMALIZADO]);
  await pool.end();
});

describe('POST /api/empleados', () => {
  it('crea un empleado con datos válidos', async () => {
    const res = await request(app).post('/api/empleados').send(empleadoValido);
    expect(res.status).toBe(201);
    expect(res.body.rut).toBe(RUT_PRUEBA_NORMALIZADO);
    expect(res.body.activo).toBe(true);
  });

  it('CP-03: rechaza un RUT duplicado con "Empleado ya registrado"', async () => {
    const res = await request(app).post('/api/empleados').send(empleadoValido);
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Empleado ya registrado');
  });

  it('rechaza un RUT inválido', async () => {
    const res = await request(app)
      .post('/api/empleados')
      .send({ ...empleadoValido, rut: '11.111.111-2' });
    expect(res.status).toBe(400);
  });

  it('rechaza si falta un campo obligatorio', async () => {
    const { nombre: _nombre, ...sinNombre } = empleadoValido;
    const res = await request(app)
      .post('/api/empleados')
      .send({ ...sinNombre, rut: '9.418.574-2' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/empleados', () => {
  it('lista solo empleados activos por defecto', async () => {
    const res = await request(app).get('/api/empleados');
    expect(res.status).toBe(200);
    expect(res.body.find((e) => e.rut === RUT_PRUEBA_NORMALIZADO)).toBeTruthy();
  });
});

describe('PUT /api/empleados/:id/desactivar', () => {
  it('desactiva un empleado existente', async () => {
    const creado = await request(app).post('/api/empleados').send({
      ...empleadoValido,
      rut: '7.594.890-5',
    });
    const res = await request(app).put(`/api/empleados/${creado.body.id}/desactivar`);
    expect(res.status).toBe(200);
    expect(res.body.activo).toBe(false);

    const reactivado = await request(app).put(`/api/empleados/${creado.body.id}/reactivar`);
    expect(reactivado.status).toBe(200);
    expect(reactivado.body.activo).toBe(true);

    const listado = await request(app).get('/api/empleados');
    expect(listado.body.find((e) => e.rut === '7594890-5')).toBeTruthy();

    await pool.query('DELETE FROM empleados WHERE rut = $1', ['7594890-5']);
  });

  it('rechaza reactivar un empleado inexistente', async () => {
    const res = await request(app).put('/api/empleados/999999/reactivar');
    expect(res.status).toBe(404);
  });
});
