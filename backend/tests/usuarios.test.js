const request = require('supertest');
const app = require('../src/app');
const pool = require('../src/config/db');
const { obtenerAuthHeader } = require('./helpers/auth');

// Email de prueba generado al azar: nunca un valor fijo/adivinable, para no poder
// colisionar con una cuenta real (ver el incidente de los RUTs fijos en los tests
// de empleados, que sí borraban datos reales).
const EMAIL_PRUEBA = `usuario-prueba-${Date.now()}-${Math.floor(Math.random() * 100000)}@test.local`;

let authHeader;
let usuarioId;
let gerenteId;

beforeAll(async () => {
  authHeader = await obtenerAuthHeader();
});

afterAll(async () => {
  const ids = [usuarioId, gerenteId].filter(Boolean);
  if (ids.length) {
    await pool.query('DELETE FROM usuarios WHERE id = ANY($1)', [ids]);
  }
  await pool.end();
});

describe('POST /api/usuarios', () => {
  it('crea un usuario con datos válidos', async () => {
    const res = await request(app)
      .post('/api/usuarios')
      .set('Authorization', authHeader)
      .send({ nombre: 'Gerente Nuevo', email: EMAIL_PRUEBA, password: 'Clave1234', rol: 'gerente' });
    expect(res.status).toBe(201);
    expect(res.body.rol).toBe('gerente');
    expect(res.body.activo).toBe(true);
    expect(res.body.password_hash).toBeUndefined();
    expect(res.body.debe_cambiar_password).toBe(true);
    usuarioId = res.body.id;
  });

  it('el primer login de un usuario recién creado exige cambiar la contraseña', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: EMAIL_PRUEBA, password: 'Clave1234' });
    expect(login.status).toBe(200);
    expect(login.body.usuario.debe_cambiar_password).toBe(true);
  });

  it('rechaza un email duplicado', async () => {
    const res = await request(app)
      .post('/api/usuarios')
      .set('Authorization', authHeader)
      .send({ nombre: 'Otro', email: EMAIL_PRUEBA, password: 'Clave1234', rol: 'gerente' });
    expect(res.status).toBe(409);
  });

  it('rechaza un rol inválido', async () => {
    const res = await request(app)
      .post('/api/usuarios')
      .set('Authorization', authHeader)
      .send({ nombre: 'Otro', email: `otro-${EMAIL_PRUEBA}`, password: 'Clave1234', rol: 'empleado' });
    expect(res.status).toBe(400);
  });

  it('rechaza una contraseña demasiado corta', async () => {
    const res = await request(app)
      .post('/api/usuarios')
      .set('Authorization', authHeader)
      .send({ nombre: 'Otro', email: `corta-${EMAIL_PRUEBA}`, password: '123', rol: 'gerente' });
    expect(res.status).toBe(400);
  });

  it('rechaza si falta un campo obligatorio', async () => {
    const res = await request(app)
      .post('/api/usuarios')
      .set('Authorization', authHeader)
      .send({ email: `sinnombre-${EMAIL_PRUEBA}`, password: 'Clave1234', rol: 'gerente' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/usuarios', () => {
  it('lista solo usuarios activos por defecto', async () => {
    const res = await request(app).get('/api/usuarios').set('Authorization', authHeader);
    expect(res.status).toBe(200);
    expect(res.body.find((u) => u.id === usuarioId)).toBeTruthy();
  });
});

describe('PUT /api/usuarios/:id', () => {
  it('actualiza nombre y rol', async () => {
    const res = await request(app)
      .put(`/api/usuarios/${usuarioId}`)
      .set('Authorization', authHeader)
      .send({ nombre: 'Gerente Editado', email: EMAIL_PRUEBA, rol: 'administrador' });
    expect(res.status).toBe(200);
    expect(res.body.nombre).toBe('Gerente Editado');
    expect(res.body.rol).toBe('administrador');
  });

  it('rechaza si el usuario no existe', async () => {
    const res = await request(app)
      .put('/api/usuarios/999999')
      .set('Authorization', authHeader)
      .send({ nombre: 'X', email: 'x@test.local', rol: 'gerente' });
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/usuarios/:id/password', () => {
  it('cambia la contraseña, permite loguear con la nueva, y vuelve a exigir cambiarla (es genérica)', async () => {
    const res = await request(app)
      .put(`/api/usuarios/${usuarioId}/password`)
      .set('Authorization', authHeader)
      .send({ password: 'NuevaClave123' });
    expect(res.status).toBe(204);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: EMAIL_PRUEBA, password: 'NuevaClave123' });
    expect(login.status).toBe(200);
    expect(login.body.usuario.debe_cambiar_password).toBe(true);
  });
});

describe('PUT /api/usuarios/me/password', () => {
  it('permite a un Gerente cambiar su propia contraseña y deja de exigir el cambio', async () => {
    const creado = await request(app)
      .post('/api/usuarios')
      .set('Authorization', authHeader)
      .send({
        nombre: 'Gerente Self Service',
        email: `self-${EMAIL_PRUEBA}`,
        password: 'ClaveInicial1',
        rol: 'gerente',
      });
    gerenteId = creado.body.id;

    const loginInicial = await request(app)
      .post('/api/auth/login')
      .send({ email: `self-${EMAIL_PRUEBA}`, password: 'ClaveInicial1' });
    expect(loginInicial.body.usuario.debe_cambiar_password).toBe(true);
    const authGerente = `Bearer ${loginInicial.body.token}`;

    const cambio = await request(app)
      .put('/api/usuarios/me/password')
      .set('Authorization', authGerente)
      .send({ password: 'MiNuevaClave1' });
    expect(cambio.status).toBe(204);

    const loginFinal = await request(app)
      .post('/api/auth/login')
      .send({ email: `self-${EMAIL_PRUEBA}`, password: 'MiNuevaClave1' });
    expect(loginFinal.status).toBe(200);
    expect(loginFinal.body.usuario.debe_cambiar_password).toBe(false);
  });

  it('rechaza una contraseña demasiado corta', async () => {
    const res = await request(app)
      .put('/api/usuarios/me/password')
      .set('Authorization', authHeader)
      .send({ password: '123' });
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/usuarios/:id/desactivar y /reactivar', () => {
  it('desactiva, impide el login, y reactivar lo permite de nuevo', async () => {
    const desactivado = await request(app)
      .put(`/api/usuarios/${usuarioId}/desactivar`)
      .set('Authorization', authHeader);
    expect(desactivado.status).toBe(200);
    expect(desactivado.body.activo).toBe(false);

    const loginBloqueado = await request(app)
      .post('/api/auth/login')
      .send({ email: EMAIL_PRUEBA, password: 'NuevaClave123' });
    expect(loginBloqueado.status).toBe(401);

    const reactivado = await request(app)
      .put(`/api/usuarios/${usuarioId}/reactivar`)
      .set('Authorization', authHeader);
    expect(reactivado.status).toBe(200);
    expect(reactivado.body.activo).toBe(true);

    const loginOk = await request(app)
      .post('/api/auth/login')
      .send({ email: EMAIL_PRUEBA, password: 'NuevaClave123' });
    expect(loginOk.status).toBe(200);
  });
});
