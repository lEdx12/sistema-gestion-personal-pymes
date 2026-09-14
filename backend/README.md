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

Cada nuevo RF debe agregar su tabla de endpoints aquí (método, ruta, body esperado,
respuesta) al completarse.

## Scripts

- `npm run dev` — servidor con nodemon
- `npm start` — servidor en modo producción
- `npm run migrate` — aplica migraciones pendientes
- `npm test` — pruebas Jest/Supertest
- `npm run lint` — ESLint
