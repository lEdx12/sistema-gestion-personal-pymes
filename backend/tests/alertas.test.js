const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');
const { obtenerAuthHeader } = require('./helpers/auth');
const { generarRutDePrueba } = require('./helpers/rut');

function fechaMasDias(dias) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  return fecha.toISOString().slice(0, 10);
}

let authHeader;
let empleadoId;
let contratoPorVencerId;

beforeAll(async () => {
  authHeader = await obtenerAuthHeader();

  const empleado = await request(app)
    .post('/api/empleados')
    .set('Authorization', authHeader)
    .send({
      rut: generarRutDePrueba(),
      nombre: 'Flavia',
      apellido: 'Vences',
      fecha_ingreso: '2026-01-01',
      cargo: 'Operaria',
      sueldo_base: 480000,
    });
  empleadoId = empleado.body.id;

  // Vence dentro de la ventana de anticipación por defecto (30 días) -> debe alertar.
  const contrato = await request(app)
    .post('/api/contratos')
    .set('Authorization', authHeader)
    .send({
      empleado_id: empleadoId,
      tipo: 'plazo_fijo',
      fecha_inicio: fechaMasDias(-300),
      fecha_termino: fechaMasDias(10),
    });
  contratoPorVencerId = contrato.body.id;
});

afterAll(async () => {
  await pool.query('DELETE FROM alertas WHERE empleado_id = $1', [empleadoId]);
  await pool.query('DELETE FROM contratos WHERE empleado_id = $1', [empleadoId]);
  await pool.query('DELETE FROM empleados WHERE id = $1', [empleadoId]);
  await pool.end();
});

describe('POST /api/alertas/generar', () => {
  it('genera una alerta para un contrato a plazo fijo que vence dentro de la ventana', async () => {
    const res = await request(app).post('/api/alertas/generar').set('Authorization', authHeader);
    expect(res.status).toBe(201);
    const generada = res.body.find((a) => a.contrato_id === contratoPorVencerId);
    expect(generada).toBeTruthy();
    expect(generada.tipo).toBe('vencimiento_contrato');
    expect(generada.leida).toBe(false);
  });

  it('no duplica la alerta si se ejecuta de nuevo', async () => {
    const res = await request(app).post('/api/alertas/generar').set('Authorization', authHeader);
    expect(res.status).toBe(201);
    expect(res.body.find((a) => a.contrato_id === contratoPorVencerId)).toBeUndefined();

    const listado = await request(app).get('/api/alertas').set('Authorization', authHeader);
    const deEsteContrato = listado.body.filter((a) => a.contrato_id === contratoPorVencerId);
    expect(deEsteContrato).toHaveLength(1);
  });
});

describe('GET /api/alertas', () => {
  it('lista la alerta generada, con los datos del empleado', async () => {
    const res = await request(app).get('/api/alertas').set('Authorization', authHeader);
    expect(res.status).toBe(200);
    const alerta = res.body.find((a) => a.contrato_id === contratoPorVencerId);
    expect(alerta.empleado_nombre).toBe('Flavia');
    expect(alerta.mensaje).toContain('Flavia Vences');
  });

  it('filtra solo las no leídas', async () => {
    const res = await request(app)
      .get('/api/alertas')
      .set('Authorization', authHeader)
      .query({ soloNoLeidas: 'true' });
    expect(res.status).toBe(200);
    expect(res.body.every((a) => a.leida === false)).toBe(true);
  });
});

describe('PUT /api/alertas/:id/leida', () => {
  it('marca una alerta como leída', async () => {
    const listado = await request(app).get('/api/alertas').set('Authorization', authHeader);
    const alerta = listado.body.find((a) => a.contrato_id === contratoPorVencerId);

    const res = await request(app)
      .put(`/api/alertas/${alerta.id}/leida`)
      .set('Authorization', authHeader);
    expect(res.status).toBe(200);
    expect(res.body.leida).toBe(true);
  });

  it('rechaza si la alerta no existe', async () => {
    const res = await request(app).put('/api/alertas/999999/leida').set('Authorization', authHeader);
    expect(res.status).toBe(404);
  });
});

describe('RF-05: no alerta contratos fuera de alcance', () => {
  it('no genera alerta para un contrato indefinido ni uno a plazo fijo lejano', async () => {
    const empleadoIndefinido = await request(app)
      .post('/api/empleados')
      .set('Authorization', authHeader)
      .send({
        rut: generarRutDePrueba(),
        nombre: 'Indefinido',
        apellido: 'Lejano',
        fecha_ingreso: '2026-01-01',
        sueldo_base: 480000,
      });
    await request(app)
      .post('/api/contratos')
      .set('Authorization', authHeader)
      .send({ empleado_id: empleadoIndefinido.body.id, tipo: 'indefinido', fecha_inicio: fechaMasDias(-10) });

    const empleadoLejano = await request(app)
      .post('/api/empleados')
      .set('Authorization', authHeader)
      .send({
        rut: generarRutDePrueba(),
        nombre: 'Plazo',
        apellido: 'Lejano',
        fecha_ingreso: '2026-01-01',
        sueldo_base: 480000,
      });
    await request(app)
      .post('/api/contratos')
      .set('Authorization', authHeader)
      .send({
        empleado_id: empleadoLejano.body.id,
        tipo: 'plazo_fijo',
        fecha_inicio: fechaMasDias(-10),
        fecha_termino: fechaMasDias(90),
      });

    const res = await request(app).post('/api/alertas/generar').set('Authorization', authHeader);
    expect(res.body.find((a) => a.empleado_id === empleadoIndefinido.body.id)).toBeUndefined();
    expect(res.body.find((a) => a.empleado_id === empleadoLejano.body.id)).toBeUndefined();

    await pool.query('DELETE FROM contratos WHERE empleado_id IN ($1, $2)', [
      empleadoIndefinido.body.id,
      empleadoLejano.body.id,
    ]);
    await pool.query('DELETE FROM empleados WHERE id IN ($1, $2)', [
      empleadoIndefinido.body.id,
      empleadoLejano.body.id,
    ]);
  });
});
