const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');
const { obtenerAuthHeader, obtenerAuthHeaderGerente } = require('./helpers/auth');

let authAdmin;
let authGerente;

beforeAll(async () => {
  authAdmin = await obtenerAuthHeader();
  authGerente = await obtenerAuthHeaderGerente();
});

afterAll(async () => {
  await pool.end();
});

describe('RF-02: el Gerente solo puede leer reportes, liquidaciones e historial', () => {
  it('permite al Gerente listar liquidaciones', async () => {
    const res = await request(app).get('/api/liquidaciones').set('Authorization', authGerente);
    expect(res.status).not.toBe(403);
  });

  it('permite al Gerente ver el historial de remuneraciones', async () => {
    const res = await request(app)
      .get('/api/liquidaciones/historial')
      .set('Authorization', authGerente)
      .query({ empleado_id: 999999 });
    expect(res.status).not.toBe(403);
  });

  it('permite al Gerente ver el reporte mensual de asistencia', async () => {
    const res = await request(app)
      .get('/api/asistencia/reporte-mensual')
      .set('Authorization', authGerente)
      .query({ periodo: '2026-01' });
    expect(res.status).not.toBe(403);
  });

  it('rechaza al Gerente generar una liquidación', async () => {
    const res = await request(app)
      .post('/api/liquidaciones')
      .set('Authorization', authGerente)
      .send({ empleado_id: 999999, periodo: '2026-01' });
    expect(res.status).toBe(403);
  });

  it('rechaza al Gerente listar empleados', async () => {
    const res = await request(app).get('/api/empleados').set('Authorization', authGerente);
    expect(res.status).toBe(403);
  });

  it('rechaza al Gerente crear un empleado', async () => {
    const res = await request(app)
      .post('/api/empleados')
      .set('Authorization', authGerente)
      .send({ rut: '1-9', nombre: 'X', apellido: 'Y', fecha_ingreso: '2026-01-01', sueldo_base: 1 });
    expect(res.status).toBe(403);
  });

  it('rechaza al Gerente listar contratos', async () => {
    const res = await request(app).get('/api/contratos').set('Authorization', authGerente);
    expect(res.status).toBe(403);
  });

  it('rechaza al Gerente registrar asistencia', async () => {
    const res = await request(app)
      .post('/api/asistencia/entrada')
      .set('Authorization', authGerente)
      .send({ empleado_id: 999999, fecha: '2026-01-01', hora_entrada: '08:00' });
    expect(res.status).toBe(403);
  });

  it('rechaza al Gerente el resumen semanal de asistencia', async () => {
    const res = await request(app)
      .get('/api/asistencia/resumen-semanal')
      .set('Authorization', authGerente)
      .query({ empleado_id: 999999, desde: '2026-01-01', hasta: '2026-01-07' });
    expect(res.status).toBe(403);
  });

  it('rechaza al Gerente la gestión de usuarios (RF-14)', async () => {
    const res = await request(app).get('/api/usuarios').set('Authorization', authGerente);
    expect(res.status).toBe(403);
  });
});

describe('RF-02: el Administrador conserva acceso completo', () => {
  it('permite al Administrador listar empleados, contratos y liquidaciones', async () => {
    const empleados = await request(app).get('/api/empleados').set('Authorization', authAdmin);
    const contratos = await request(app).get('/api/contratos').set('Authorization', authAdmin);
    const liquidaciones = await request(app).get('/api/liquidaciones').set('Authorization', authAdmin);
    expect(empleados.status).not.toBe(403);
    expect(contratos.status).not.toBe(403);
    expect(liquidaciones.status).not.toBe(403);
  });
});
