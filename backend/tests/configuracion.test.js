const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');
const { obtenerAuthHeader, obtenerAuthHeaderGerente } = require('./helpers/auth');

let authHeader;
let authHeaderGerente;
let configuracionOriginal;
let tramosOriginales;

beforeAll(async () => {
  authHeader = await obtenerAuthHeader();
  authHeaderGerente = await obtenerAuthHeaderGerente();

  // Guarda el estado inicial para restaurarlo en afterAll: esta tabla es una fila única
  // compartida por todo el sistema (y por el resto de la suite), no datos propios de
  // este archivo — nunca se debe dejar mutada.
  const config = await request(app).get('/api/configuracion').set('Authorization', authHeader);
  configuracionOriginal = config.body;
  const tramos = await request(app).get('/api/configuracion/tramos-impuesto').set('Authorization', authHeader);
  tramosOriginales = tramos.body;
});

afterAll(async () => {
  await request(app).put('/api/configuracion').set('Authorization', authHeader).send(configuracionOriginal);
  await request(app)
    .put('/api/configuracion/tramos-impuesto')
    .set('Authorization', authHeader)
    .send({ tramos: tramosOriginales });
  await pool.end();
});

describe('GET /api/configuracion', () => {
  it('devuelve la configuración de sueldo', async () => {
    const res = await request(app).get('/api/configuracion').set('Authorization', authHeader);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('afp_porcentaje');
    expect(res.body).toHaveProperty('movilizacion_monto');
    expect(res.body).toHaveProperty('valor_utm');
  });

  it('rechaza a un Gerente (solo Administrador)', async () => {
    const res = await request(app).get('/api/configuracion').set('Authorization', authHeaderGerente);
    expect(res.status).toBe(403);
  });

  it('rechaza sin autenticar', async () => {
    const res = await request(app).get('/api/configuracion');
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/configuracion', () => {
  const datosValidos = {
    afp_porcentaje: 0.115,
    salud_porcentaje: 0.07,
    afc_indefinido_porcentaje: 0.006,
    afc_plazo_fijo_porcentaje: 0,
    gratificacion_porcentaje: 0.25,
    gratificacion_tope_mensual: 250000,
    movilizacion_monto: 30000,
    colacion_monto: 25000,
    valor_utm: 68785,
  };

  it('actualiza la configuración con datos válidos', async () => {
    const res = await request(app).put('/api/configuracion').set('Authorization', authHeader).send(datosValidos);
    expect(res.status).toBe(200);
    expect(Number(res.body.movilizacion_monto)).toBe(30000);
    expect(Number(res.body.colacion_monto)).toBe(25000);
    expect(Number(res.body.afp_porcentaje)).toBe(0.115);
  });

  it('rechaza un porcentaje fuera de rango (> 1)', async () => {
    const res = await request(app)
      .put('/api/configuracion')
      .set('Authorization', authHeader)
      .send({ ...datosValidos, afp_porcentaje: 1.5 });
    expect(res.status).toBe(400);
  });

  it('rechaza un monto negativo', async () => {
    const res = await request(app)
      .put('/api/configuracion')
      .set('Authorization', authHeader)
      .send({ ...datosValidos, movilizacion_monto: -1000 });
    expect(res.status).toBe(400);
  });

  it('rechaza a un Gerente', async () => {
    const res = await request(app)
      .put('/api/configuracion')
      .set('Authorization', authHeaderGerente)
      .send(datosValidos);
    expect(res.status).toBe(403);
  });
});

describe('GET /api/configuracion/tramos-impuesto', () => {
  it('devuelve los tramos ordenados', async () => {
    const res = await request(app).get('/api/configuracion/tramos-impuesto').set('Authorization', authHeader);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    const ordenes = res.body.map((t) => t.orden);
    expect(ordenes).toEqual([...ordenes].sort((a, b) => a - b));
  });
});

describe('PUT /api/configuracion/tramos-impuesto', () => {
  const tramosValidos = [
    { orden: 1, desde_utm: 0, hasta_utm: 10, factor: 0, rebaja_utm: 0 },
    { orden: 2, desde_utm: 10, hasta_utm: null, factor: 0.1, rebaja_utm: 1 },
  ];

  it('reemplaza la tabla de tramos con un conjunto válido', async () => {
    const res = await request(app)
      .put('/api/configuracion/tramos-impuesto')
      .set('Authorization', authHeader)
      .send({ tramos: tramosValidos });
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.find((t) => t.orden === 2).hasta_utm).toBeNull();
  });

  it('rechaza si hay un hueco entre tramos (desde_utm no continúa el anterior)', async () => {
    const res = await request(app)
      .put('/api/configuracion/tramos-impuesto')
      .set('Authorization', authHeader)
      .send({
        tramos: [
          { orden: 1, desde_utm: 0, hasta_utm: 10, factor: 0, rebaja_utm: 0 },
          { orden: 2, desde_utm: 15, hasta_utm: null, factor: 0.1, rebaja_utm: 1 },
        ],
      });
    expect(res.status).toBe(400);
  });

  it('rechaza si un tramo que no es el último se deja sin tope', async () => {
    const res = await request(app)
      .put('/api/configuracion/tramos-impuesto')
      .set('Authorization', authHeader)
      .send({
        tramos: [
          { orden: 1, desde_utm: 0, hasta_utm: null, factor: 0, rebaja_utm: 0 },
          { orden: 2, desde_utm: 10, hasta_utm: null, factor: 0.1, rebaja_utm: 1 },
        ],
      });
    expect(res.status).toBe(400);
  });

  it('rechaza si el primer tramo no empieza en 0', async () => {
    const res = await request(app)
      .put('/api/configuracion/tramos-impuesto')
      .set('Authorization', authHeader)
      .send({ tramos: [{ orden: 1, desde_utm: 5, hasta_utm: null, factor: 0.1, rebaja_utm: 0 }] });
    expect(res.status).toBe(400);
  });

  it('rechaza un factor fuera de rango', async () => {
    const res = await request(app)
      .put('/api/configuracion/tramos-impuesto')
      .set('Authorization', authHeader)
      .send({ tramos: [{ orden: 1, desde_utm: 0, hasta_utm: null, factor: 1.5, rebaja_utm: 0 }] });
    expect(res.status).toBe(400);
  });

  it('rechaza un arreglo vacío', async () => {
    const res = await request(app)
      .put('/api/configuracion/tramos-impuesto')
      .set('Authorization', authHeader)
      .send({ tramos: [] });
    expect(res.status).toBe(400);
  });

  it('rechaza a un Gerente', async () => {
    const res = await request(app)
      .put('/api/configuracion/tramos-impuesto')
      .set('Authorization', authHeaderGerente)
      .send({ tramos: tramosValidos });
    expect(res.status).toBe(403);
  });
});
