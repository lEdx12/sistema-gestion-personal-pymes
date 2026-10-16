# Sistema de Gestión de Personal para PyMES

Trabajo de Título (UNAB) — ver [`PROJECT.md`](./PROJECT.md) para el contexto completo
del negocio, el modelo de datos, las reglas legales chilenas y el backlog de RF/RNF.

## Estructura

```
/backend    Node.js + Express + PostgreSQL (pg). Ver backend/README.md
/frontend   React (Vite) + Axios + React Router
PROJECT.md  Contexto técnico y de negocio para los agentes de desarrollo
```

## Levantar el entorno local

Requisitos: Node.js 22+, PostgreSQL 17 (servicio `postgresql-x64-17` corriendo
localmente, base `personal_pymes`, usuario `postgres`).

```bash
# Backend
cd backend
cp .env.example .env   # revisar credenciales y ADMIN_EMAIL/ADMIN_PASSWORD
npm install
npm run migrate
npm run seed:admin      # crea el usuario administrador (RF-01)
npm run dev             # http://localhost:4000

# Frontend (otra terminal)
cd frontend
cp .env.example .env
npm install
npm run dev             # http://localhost:5173
```

La página de inicio del frontend llama a `GET /api/health` para confirmar que ambos
servicios se comunican correctamente. Desde RF-01 (Sprint 2), el resto de la app exige
iniciar sesión en `/login` con las credenciales de `ADMIN_EMAIL`/`ADMIN_PASSWORD` — ver
`backend/README.md` sección "Autenticación".

## Metodología

Scrum, con el backlog y los sprints gestionados en Jira (proyecto `SCRUM`). El orden de
implementación de los Requerimientos Funcionales y la planificación de sprints vive en
`PROJECT.md` (secciones 6, 8 y 9) — ese documento es la fuente de verdad técnica, Jira
es la fuente de verdad de tracking/fechas.

## Control de versiones (Git Flow)

- `main` — versión estable, se actualiza al cerrar cada sprint.
- `develop` — integración continua de features dentro de un sprint.
- `feature/rf-XX-nombre-corto` — una rama por Requerimiento Funcional (o tarea),
  mergeada a `develop` vía PR.

Commits convencionales (`feat:`, `fix:`, `test:`, `docs:`, `chore:`), en español.

## Trabajo en paralelo (Claude Code + Devin)

Ambos agentes operan sobre este mismo directorio/repositorio. Para evitar choques:

- Cada RF se trabaja en su propia rama `feature/rf-XX-...` — nunca dos agentes en la
  misma rama al mismo tiempo.
- Antes de empezar un RF, confirmar en Jira que nadie más lo tiene en progreso.
- Hacer commits pequeños y frecuentes, y `git pull` antes de crear una rama nueva.
- Los cambios al esquema de BD van en un nuevo archivo `backend/migrations/NNN_*.sql`
  (nunca editar una migración ya aplicada).

## Estado

Sprint 1 en curso — ver sección 9 de `PROJECT.md` para el detalle de cada RF.
