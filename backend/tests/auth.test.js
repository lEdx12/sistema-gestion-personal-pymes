const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');
const { asegurarUsuarioDePrueba, EMAIL, PASSWORD } = require('./helpers/auth');

beforeAll(async () => {
  await asegurarUsuarioDePrueba();
});

afterAll(async () => {
  await pool.end();
});

describe('POST /api/auth/login', () => {
  it('devuelve un token válido con credenciales correctas', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: EMAIL, password: PASSWORD });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.usuario.email).toBe(EMAIL);
    expect(res.body.usuario.rol).toBe('administrador');
    expect(res.body.usuario.password_hash).toBeUndefined();
  });

  it('rechaza una contraseña incorrecta', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: EMAIL, password: 'contraseña-incorrecta' });
    expect(res.status).toBe(401);
  });

  it('rechaza un email que no existe', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'no-existe@local.test', password: PASSWORD });
    expect(res.status).toBe(401);
  });

  it('rechaza si faltan campos', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: EMAIL });
    expect(res.status).toBe(400);
  });

  it('rechaza a un usuario desactivado', async () => {
    await pool.query('UPDATE usuarios SET activo = FALSE WHERE email = $1', [EMAIL]);
    const res = await request(app).post('/api/auth/login').send({ email: EMAIL, password: PASSWORD });
    expect(res.status).toBe(401);
    await pool.query('UPDATE usuarios SET activo = TRUE WHERE email = $1', [EMAIL]);
  });
});

describe('POST /api/auth/logout', () => {
  it('responde 200 (no hay estado de sesión que invalidar con JWT)', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
  });
});

describe('Middleware de autenticación', () => {
  it('rechaza una petición a un endpoint protegido sin token', async () => {
    const res = await request(app).get('/api/empleados');
    expect(res.status).toBe(401);
  });

  it('rechaza un token malformado', async () => {
    const res = await request(app).get('/api/empleados').set('Authorization', 'Bearer token-invalido');
    expect(res.status).toBe(401);
  });

  it('rechaza si falta el prefijo "Bearer"', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: EMAIL, password: PASSWORD });
    const res = await request(app).get('/api/empleados').set('Authorization', login.body.token);
    expect(res.status).toBe(401);
  });

  it('acepta un token válido', async () => {
    const login = await request(app).post('/api/auth/login').send({ email: EMAIL, password: PASSWORD });
    const res = await request(app)
      .get('/api/empleados')
      .set('Authorization', `Bearer ${login.body.token}`);
    expect(res.status).toBe(200);
  });
});
