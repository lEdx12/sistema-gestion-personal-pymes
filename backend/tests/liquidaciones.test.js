const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');

const RUT_EMPLEADO = '12345678-5';
let empleadoId;

beforeAll(async () => {
  await pool.query('DELETE FROM empleados WHERE rut = $1', [RUT_EMPLEADO]);
  const res = await request(app).post('/api/empleados').send({
    rut: RUT_EMPLEADO,
    nombre: 'Rosa',
    apellido: 'Ibarra',
    fecha_ingreso: '2025-01-01',
    cargo: 'Analista',
    sueldo_base: 500000,
  });
  empleadoId = res.body.id;

  await request(app)
    .post('/api/contratos')
    .send({ empleado_id: empleadoId, tipo: 'indefinido', fecha_inicio: '2025-01-01' });
});

afterAll(async () => {
  await pool.query('DELETE FROM liquidaciones WHERE empleado_id = $1', [empleadoId]);
  await pool.query('DELETE FROM asistencia WHERE empleado_id = $1', [empleadoId]);
  await pool.query('DELETE FROM contratos WHERE empleado_id = $1', [empleadoId]);
  await pool.query('DELETE FROM empleados WHERE id = $1', [empleadoId]);
  await pool.end();
});

describe('POST /api/liquidaciones', () => {
  it('CP-06: sueldo base 500.000 sin horas extra -> haberes, descuentos y líquido correctos', async () => {
    const res = await request(app)
      .post('/api/liquidaciones')
      .send({ empleado_id: empleadoId, periodo: '2026-02' });

    expect(res.status).toBe(201);
    expect(Number(res.body.sueldo_base)).toBe(500000);
    expect(Number(res.body.horas_extra_monto)).toBe(0);
    expect(Number(res.body.gratificacion)).toBe(125000); // 25% de 500.000
    expect(Number(res.body.total_haberes)).toBe(625000); // 500.000 + 0 + 125.000
    expect(Number(res.body.descuento_afp)).toBe(62500); // 10% de 625.000
    expect(Number(res.body.descuento_salud)).toBe(43750); // 7% de 625.000
    expect(Number(res.body.descuento_cesantia)).toBe(3750); // 0.6% de 625.000 (indefinido)
    expect(Number(res.body.total_descuentos)).toBe(110000);
    expect(Number(res.body.liquido_pagar)).toBe(515000);
  });

  it('rechaza generar dos veces la liquidación del mismo período', async () => {
    const res = await request(app)
      .post('/api/liquidaciones')
      .send({ empleado_id: empleadoId, periodo: '2026-02' });
    expect(res.status).toBe(409);
  });

  it('rechaza un período con formato inválido', async () => {
    const res = await request(app)
      .post('/api/liquidaciones')
      .send({ empleado_id: empleadoId, periodo: '2026-2' });
    expect(res.status).toBe(400);
  });

  it('rechaza si el empleado no existe', async () => {
    const res = await request(app)
      .post('/api/liquidaciones')
      .send({ empleado_id: 999999, periodo: '2026-03' });
    expect(res.status).toBe(404);
  });

  it('rechaza si el empleado no tiene contrato activo', async () => {
    const otro = await request(app).post('/api/empleados').send({
      rut: '9.418.574-2',
      nombre: 'Sin',
      apellido: 'Contrato',
      fecha_ingreso: '2026-01-01',
      sueldo_base: 400000,
    });
    const res = await request(app)
      .post('/api/liquidaciones')
      .send({ empleado_id: otro.body.id, periodo: '2026-03' });
    expect(res.status).toBe(400);
    await pool.query('DELETE FROM empleados WHERE id = $1', [otro.body.id]);
  });

  it('incluye horas extra del período en el monto de haberes', async () => {
    const dias = ['2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05', '2026-03-06'];
    for (const fecha of dias) {
      const entrada = await request(app)
        .post('/api/asistencia/entrada')
        .send({ empleado_id: empleadoId, fecha, hora_entrada: '08:00' });
      await request(app).put(`/api/asistencia/${entrada.body.id}/salida`).send({ hora_salida: '18:00' });
    }
    // 5 días de 10h = 50h en el primer bloque semanal del período -> 5h sobrejornada

    const res = await request(app)
      .post('/api/liquidaciones')
      .send({ empleado_id: empleadoId, periodo: '2026-03' });

    expect(res.status).toBe(201);
    expect(Number(res.body.horas_extra_monto)).toBeGreaterThan(0);
  });
});

describe('GET /api/liquidaciones', () => {
  it('filtra por empleado_id', async () => {
    const res = await request(app).get(`/api/liquidaciones?empleado_id=${empleadoId}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    expect(res.body.every((l) => l.empleado_id === empleadoId)).toBe(true);
  });
});
