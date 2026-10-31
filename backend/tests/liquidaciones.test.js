const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../src/app');
const pool = require('../src/config/db');
const { obtenerAuthHeader, obtenerAuthHeaderGerente } = require('./helpers/auth');
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
      nombre: 'Rosa',
      apellido: 'Ibarra',
      fecha_ingreso: '2025-01-01',
      cargo: 'Analista',
      sueldo_base: 500000,
    });
  empleadoId = res.body.id;

  await request(app)
    .post('/api/contratos')
    .set('Authorization', authHeader)
    .send({ empleado_id: empleadoId, tipo: 'indefinido', fecha_inicio: '2025-01-01' });
});

afterAll(async () => {
  // Borrar solo los PDF que generó este archivo (por nombre exacto), nunca la carpeta
  // entera: ahí también caen los PDF reales que descargan usuarios de verdad.
  const { rows: generados } = await pool.query(
    'SELECT pdf_url FROM liquidaciones WHERE empleado_id = $1 AND pdf_url IS NOT NULL',
    [empleadoId],
  );
  for (const { pdf_url: pdfUrl } of generados) {
    fs.rmSync(path.join(__dirname, '..', 'uploads', 'liquidaciones', path.basename(pdfUrl)), { force: true });
  }
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
      .set('Authorization', authHeader)
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
      .set('Authorization', authHeader)
      .send({ empleado_id: empleadoId, periodo: '2026-02' });
    expect(res.status).toBe(409);
  });

  it('rechaza un período con formato inválido', async () => {
    const res = await request(app)
      .post('/api/liquidaciones')
      .set('Authorization', authHeader)
      .send({ empleado_id: empleadoId, periodo: '2026-2' });
    expect(res.status).toBe(400);
  });

  it('rechaza si el empleado no existe', async () => {
    const res = await request(app)
      .post('/api/liquidaciones')
      .set('Authorization', authHeader)
      .send({ empleado_id: 999999, periodo: '2026-03' });
    expect(res.status).toBe(404);
  });

  it('rechaza si el empleado no tiene contrato activo', async () => {
    const otro = await request(app)
      .post('/api/empleados')
      .set('Authorization', authHeader)
      .send({
        rut: generarRutDePrueba(),
        nombre: 'Sin',
        apellido: 'Contrato',
        fecha_ingreso: '2026-01-01',
        sueldo_base: 400000,
      });
    const res = await request(app)
      .post('/api/liquidaciones')
      .set('Authorization', authHeader)
      .send({ empleado_id: otro.body.id, periodo: '2026-03' });
    expect(res.status).toBe(400);
    await pool.query('DELETE FROM empleados WHERE id = $1', [otro.body.id]);
  });

  it('incluye horas extra del período en el monto de haberes', async () => {
    const dias = ['2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05', '2026-03-06'];
    for (const fecha of dias) {
      const entrada = await request(app)
        .post('/api/asistencia/entrada')
        .set('Authorization', authHeader)
        .send({ empleado_id: empleadoId, fecha, hora_entrada: '08:00' });
      await request(app)
        .put(`/api/asistencia/${entrada.body.id}/salida`)
        .set('Authorization', authHeader)
        .send({ hora_salida: '18:00' });
    }
    // 5 días de 10h = 50h en el primer bloque semanal del período -> 5h sobrejornada

    const res = await request(app)
      .post('/api/liquidaciones')
      .set('Authorization', authHeader)
      .send({ empleado_id: empleadoId, periodo: '2026-03' });

    expect(res.status).toBe(201);
    expect(Number(res.body.horas_extra_monto)).toBeGreaterThan(0);
  });

  it('registra el usuario autenticado como generado_por', async () => {
    const res = await request(app)
      .post('/api/liquidaciones')
      .set('Authorization', authHeader)
      .send({ empleado_id: empleadoId, periodo: '2026-04' });
    expect(res.status).toBe(201);
    expect(res.body.generado_por).not.toBeNull();
  });
});

describe('RF-16/RF-17: movilización, colación e impuesto único (configurables)', () => {
  let configuracionOriginal;

  beforeAll(async () => {
    const actual = await request(app).get('/api/configuracion').set('Authorization', authHeader);
    configuracionOriginal = actual.body;
  });

  afterAll(async () => {
    // Nunca dejar la configuración (fila única, compartida por todo el sistema) mutada
    // para el resto de la suite.
    await request(app).put('/api/configuracion').set('Authorization', authHeader).send(configuracionOriginal);
  });

  it('suma movilización/colación a los haberes sin que afecten AFP/salud/cesantía, y aplica impuesto único cuando corresponde', async () => {
    await request(app)
      .put('/api/configuracion')
      .set('Authorization', authHeader)
      .send({
        ...configuracionOriginal,
        afp_porcentaje: 0.1,
        salud_porcentaje: 0.07,
        movilizacion_monto: 30000,
        colacion_monto: 20000,
      });

    const otro = await request(app)
      .post('/api/empleados')
      .set('Authorization', authHeader)
      .send({
        rut: generarRutDePrueba(),
        nombre: 'Sueldo',
        apellido: 'Alto',
        fecha_ingreso: '2025-01-01',
        cargo: 'Gerente de Área',
        sueldo_base: 1500000,
      });
    await request(app)
      .post('/api/contratos')
      .set('Authorization', authHeader)
      .send({ empleado_id: otro.body.id, tipo: 'indefinido', fecha_inicio: '2025-01-01' });

    const res = await request(app)
      .post('/api/liquidaciones')
      .set('Authorization', authHeader)
      .send({ empleado_id: otro.body.id, periodo: '2026-05' });

    expect(res.status).toBe(201);
    expect(Number(res.body.movilizacion)).toBe(30000);
    expect(Number(res.body.colacion)).toBe(20000);

    const baseImponible = Number(res.body.sueldo_base) + Number(res.body.horas_extra_monto) + Number(res.body.gratificacion);
    expect(Number(res.body.descuento_afp)).toBe(Math.round(baseImponible * 0.1));
    expect(Number(res.body.descuento_salud)).toBe(Math.round(baseImponible * 0.07));
    // Con un sueldo alto, la base tributable debería superar el tramo exento.
    expect(Number(res.body.descuento_impuesto)).toBeGreaterThan(0);

    const totalDescuentosEsperado =
      Number(res.body.descuento_afp) +
      Number(res.body.descuento_salud) +
      Number(res.body.descuento_cesantia) +
      Number(res.body.descuento_impuesto);
    expect(Number(res.body.total_descuentos)).toBe(totalDescuentosEsperado);

    const totalHaberesEsperado = baseImponible + 30000 + 20000;
    expect(Number(res.body.total_haberes)).toBe(totalHaberesEsperado);
    expect(Number(res.body.liquido_pagar)).toBe(totalHaberesEsperado - totalDescuentosEsperado);

    await pool.query('DELETE FROM liquidaciones WHERE empleado_id = $1', [otro.body.id]);
    await pool.query('DELETE FROM contratos WHERE empleado_id = $1', [otro.body.id]);
    await pool.query('DELETE FROM empleados WHERE id = $1', [otro.body.id]);
  });

  it('no aplica impuesto único cuando la base tributable queda dentro del tramo exento', async () => {
    await request(app)
      .put('/api/configuracion')
      .set('Authorization', authHeader)
      .send({ ...configuracionOriginal, movilizacion_monto: 0, colacion_monto: 0 });

    const res = await request(app)
      .post('/api/liquidaciones')
      .set('Authorization', authHeader)
      .send({ empleado_id: empleadoId, periodo: '2026-06' });

    expect(res.status).toBe(201);
    expect(Number(res.body.descuento_impuesto)).toBe(0);
  });
});

describe('GET /api/liquidaciones/:id', () => {
  it('incluye nombre, apellido y rut del empleado (RF-18: página de detalle)', async () => {
    const listado = await request(app)
      .get(`/api/liquidaciones?empleado_id=${empleadoId}`)
      .set('Authorization', authHeader);
    const liquidacion = listado.body[0];

    const res = await request(app).get(`/api/liquidaciones/${liquidacion.id}`).set('Authorization', authHeader);
    expect(res.status).toBe(200);
    expect(res.body.empleado_nombre).toBe('Rosa');
    expect(res.body.empleado_apellido).toBe('Ibarra');
    expect(res.body.empleado_rut).toBe(RUT_EMPLEADO);
  });

  it('es accesible también para un Gerente (solo lectura)', async () => {
    const authHeaderGerente = await obtenerAuthHeaderGerente();
    const listado = await request(app)
      .get(`/api/liquidaciones?empleado_id=${empleadoId}`)
      .set('Authorization', authHeader);
    const liquidacion = listado.body[0];

    const res = await request(app)
      .get(`/api/liquidaciones/${liquidacion.id}`)
      .set('Authorization', authHeaderGerente);
    expect(res.status).toBe(200);
  });

  it('rechaza si la liquidación no existe', async () => {
    const res = await request(app).get('/api/liquidaciones/999999').set('Authorization', authHeader);
    expect(res.status).toBe(404);
  });
});

describe('GET /api/liquidaciones', () => {
  it('filtra por empleado_id', async () => {
    const res = await request(app)
      .get(`/api/liquidaciones?empleado_id=${empleadoId}`)
      .set('Authorization', authHeader);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    expect(res.body.every((l) => l.empleado_id === empleadoId)).toBe(true);
  });
});

describe('GET /api/liquidaciones/:id/pdf', () => {
  it('genera y descarga el PDF, y deja guardado pdf_url', async () => {
    const listado = await request(app)
      .get(`/api/liquidaciones?empleado_id=${empleadoId}`)
      .set('Authorization', authHeader);
    const liquidacion = listado.body.find((l) => l.periodo === '2026-02');

    const res = await request(app)
      .get(`/api/liquidaciones/${liquidacion.id}/pdf`)
      .set('Authorization', authHeader);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toContain('attachment');
    expect(res.headers['content-disposition']).toContain('rosa-ibarra');
    expect(res.body.slice(0, 4).toString()).toBe('%PDF');

    const actualizada = await request(app)
      .get(`/api/liquidaciones/${liquidacion.id}`)
      .set('Authorization', authHeader);
    expect(actualizada.body.pdf_url).toMatch(/^\/uploads\/liquidaciones\/liquidacion-/);
  });

  it('reutiliza el PDF ya generado en la segunda descarga', async () => {
    const listado = await request(app)
      .get(`/api/liquidaciones?empleado_id=${empleadoId}`)
      .set('Authorization', authHeader);
    const liquidacion = listado.body.find((l) => l.periodo === '2026-02');

    const primera = await request(app)
      .get(`/api/liquidaciones/${liquidacion.id}/pdf`)
      .set('Authorization', authHeader);
    const segunda = await request(app)
      .get(`/api/liquidaciones/${liquidacion.id}/pdf`)
      .set('Authorization', authHeader);
    expect(segunda.status).toBe(200);
    expect(segunda.body.length).toBe(primera.body.length);
  });

  it('rechaza si la liquidación no existe', async () => {
    const res = await request(app)
      .get('/api/liquidaciones/999999/pdf')
      .set('Authorization', authHeader);
    expect(res.status).toBe(404);
  });
});
