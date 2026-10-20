const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../src/app');
const pool = require('../src/config/db');
const { obtenerAuthHeader } = require('./helpers/auth');
const { generarRutDePrueba } = require('./helpers/rut');

let authHeader;
let empleadoId;
const archivosSubidos = [];

beforeAll(async () => {
  authHeader = await obtenerAuthHeader();

  const empleado = await request(app)
    .post('/api/empleados')
    .set('Authorization', authHeader)
    .send({
      rut: generarRutDePrueba(),
      nombre: 'Daniela',
      apellido: 'Rojas',
      fecha_ingreso: '2026-01-01',
      cargo: 'Contadora',
      sueldo_base: 520000,
    });
  empleadoId = empleado.body.id;
});

afterAll(async () => {
  for (const archivo of archivosSubidos) {
    fs.rmSync(path.join(__dirname, '..', 'uploads', 'documentos', archivo), { force: true });
  }
  await pool.query('DELETE FROM documentos WHERE empleado_id = $1', [empleadoId]);
  await pool.query('DELETE FROM empleados WHERE id = $1', [empleadoId]);
  await pool.end();
});

describe('POST /api/documentos', () => {
  it('sube un documento y lo asocia al empleado (RF-11, fallback a disco local)', async () => {
    const res = await request(app)
      .post('/api/documentos')
      .set('Authorization', authHeader)
      .field('empleado_id', String(empleadoId))
      .field('tipo', 'cedula')
      .attach('documento', Buffer.from('contenido de prueba'), {
        filename: 'cedula.pdf',
        contentType: 'application/pdf',
      });

    expect(res.status).toBe(201);
    expect(res.body.empleado_id).toBe(empleadoId);
    expect(res.body.tipo).toBe('cedula');
    expect(res.body.url).toMatch(/^\/uploads\/documentos\//);
    archivosSubidos.push(path.basename(res.body.url));
  });

  it('rechaza un tipo de archivo no permitido', async () => {
    const res = await request(app)
      .post('/api/documentos')
      .set('Authorization', authHeader)
      .field('empleado_id', String(empleadoId))
      .attach('documento', Buffer.from('contenido'), {
        filename: 'virus.exe',
        contentType: 'application/octet-stream',
      });
    expect(res.status).toBe(400);
  });

  it('rechaza si no se envía ningún archivo', async () => {
    const res = await request(app)
      .post('/api/documentos')
      .set('Authorization', authHeader)
      .field('empleado_id', String(empleadoId));
    expect(res.status).toBe(400);
  });

  it('rechaza si falta empleado_id', async () => {
    const res = await request(app)
      .post('/api/documentos')
      .set('Authorization', authHeader)
      .attach('documento', Buffer.from('contenido'), {
        filename: 'cedula.pdf',
        contentType: 'application/pdf',
      });
    expect(res.status).toBe(400);
  });

  it('rechaza si el empleado no existe', async () => {
    const res = await request(app)
      .post('/api/documentos')
      .set('Authorization', authHeader)
      .field('empleado_id', '999999')
      .attach('documento', Buffer.from('contenido'), {
        filename: 'cedula.pdf',
        contentType: 'application/pdf',
      });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/documentos', () => {
  it('lista los documentos del empleado', async () => {
    const res = await request(app)
      .get('/api/documentos')
      .set('Authorization', authHeader)
      .query({ empleado_id: empleadoId });
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].nombre).toBe('cedula.pdf');
  });

  it('rechaza si falta empleado_id', async () => {
    const res = await request(app).get('/api/documentos').set('Authorization', authHeader);
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/documentos/:id', () => {
  it('elimina el documento (de la BD y del disco) y ya no aparece en el listado', async () => {
    const listado = await request(app)
      .get('/api/documentos')
      .set('Authorization', authHeader)
      .query({ empleado_id: empleadoId });
    const documento = listado.body[0];
    const nombreArchivo = path.basename(documento.url);

    const res = await request(app).delete(`/api/documentos/${documento.id}`).set('Authorization', authHeader);
    expect(res.status).toBe(204);

    const existeEnDisco = fs.existsSync(path.join(__dirname, '..', 'uploads', 'documentos', nombreArchivo));
    expect(existeEnDisco).toBe(false);

    const listadoFinal = await request(app)
      .get('/api/documentos')
      .set('Authorization', authHeader)
      .query({ empleado_id: empleadoId });
    expect(listadoFinal.body).toHaveLength(0);
  });

  it('rechaza si el documento no existe', async () => {
    const res = await request(app).delete('/api/documentos/999999').set('Authorization', authHeader);
    expect(res.status).toBe(404);
  });
});
