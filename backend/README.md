# Backend — Sistema de Gestión de Personal para PyMES

Node.js + Express + PostgreSQL (vía `pg`, sin ORM — ver decisión abajo).

## Setup

```bash
cp .env.example .env   # ajustar credenciales de PostgreSQL
npm install
npm run migrate        # aplica backend/migrations/*.sql
npm run dev
```

El servidor queda en `http://localhost:4000`.

## Decisión de acceso a datos

Se usa `pg` (node-postgres) con SQL crudo en lugar de un ORM (Prisma/Sequelize). El
esquema de la sección 4 de `PROJECT.md` ya está completamente definido con constraints
específicos del dominio; mapearlo a un DSL de ORM no aporta valor en un equipo pequeño y
evita una dependencia adicional no justificada. Las migraciones son archivos `.sql`
planos en `/migrations`, aplicados y registrados por `src/config/runMigrations.js`
(tabla `schema_migrations`).

## Autenticación (Sprint 1)

Mientras no se implemente RF-01, todas las rutas pasan por
`src/middleware/mockAuth.js`, que inyecta un usuario administrador de prueba
(`req.user = { id: 0, rol: 'administrador' }`). Este middleware se retira al
completar RF-01 en el Sprint 2.

## Endpoints

| Método | Ruta | Body | Respuesta |
|--------|------|------|-----------|
| GET | `/api/health` | — | `{ status: 'ok', user }` — verifica que el backend está arriba y expone el usuario mock |
| GET | `/api/empleados` | — (query opcional `?incluirInactivos=true`) | `200` lista de empleados (activos por defecto) |
| GET | `/api/empleados/:id` | — | `200` empleado / `404` si no existe |
| POST | `/api/empleados` | `{ rut, nombre, apellido, fecha_ingreso, sueldo_base, fecha_nacimiento?, direccion?, telefono?, email?, cargo? }` | `201` empleado creado / `400` validación (campo obligatorio o RUT inválido) / `409` "Empleado ya registrado" si el RUT ya existe |
| PUT | `/api/empleados/:id` | mismos campos que POST (sin `rut`) | `200` empleado actualizado / `400` / `404` |
| PUT | `/api/empleados/:id/desactivar` | — | `200` empleado con `activo: false` / `404` |

RF-03 (registro de empleados): validación de RUT chileno (dígito verificador, módulo 11)
en `src/utils/rut.js`, reglas de negocio en `src/services/empleados.service.js`, acceso a
datos en `src/models/empleado.model.js`. Pruebas en `tests/rut.test.js` y
`tests/empleados.test.js` (incluye CP-03: RUT duplicado).

| Método | Ruta | Body | Respuesta |
|--------|------|------|-----------|
| GET | `/api/contratos` | — (query opcional `?empleado_id=N`) | `200` lista de contratos |
| GET | `/api/contratos/:id` | — | `200` contrato / `404` |
| POST | `/api/contratos` | `{ empleado_id, tipo, fecha_inicio, fecha_termino?, documento_url? }` | `201` creado / `400` validación / `404` empleado no existe / `409` empleado ya tiene contrato activo |
| PUT | `/api/contratos/:id` | mismos campos que POST (sin `empleado_id`) | `200` actualizado / `400` / `404` |
| PUT | `/api/contratos/:id/renovar` | `{ tipo, fecha_inicio, fecha_termino? }` del nuevo contrato | `201` nuevo contrato activo (cierra el anterior, transacción atómica) / `400` / `404` |

RF-04 (gestión de contratos): `tipo` debe ser `indefinido` o `plazo_fijo`; si es
`plazo_fijo`, `fecha_termino` es obligatoria y debe ser posterior a `fecha_inicio`. Un
empleado solo puede tener un contrato activo a la vez — para reemplazarlo se usa
`renovar`, que cierra el contrato vigente (`activo=false`, `fecha_termino` = inicio del
nuevo) y crea el siguiente dentro de la misma transacción de BD
(`src/services/contratos.service.js`). Pruebas en `tests/contratos.test.js`.

Cada nuevo RF debe agregar su tabla de endpoints aquí (método, ruta, body esperado,
respuesta) al completarse.

## Scripts

- `npm run dev` — servidor con nodemon
- `npm start` — servidor en modo producción
- `npm run migrate` — aplica migraciones pendientes
- `npm test` — pruebas Jest/Supertest
- `npm run lint` — ESLint
