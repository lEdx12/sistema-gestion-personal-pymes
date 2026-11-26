# Migrar el sistema a otro equipo

Esta guía sirve para mover el proyecto completo (código + base de datos + archivos
subidos) a un PC distinto, dejándolo en el mismo estado en que quedó en el equipo
de origen.

## 1. Requisitos en el equipo nuevo

Los mismos que en [`README.md`](./README.md): Node.js 22+, PostgreSQL 17 instalado y
corriendo localmente.

## 2. Código

```bash
git clone https://github.com/lEdx12/sistema-gestion-personal-pymes.git
cd sistema-gestion-personal-pymes
git checkout develop
```

## 3. Variables de entorno

`backend/.env` y `frontend/.env` **no están en git** (contienen credenciales: password
de BD, `JWT_SECRET`, `CLOUDINARY_URL`, `ADMIN_EMAIL`/`ADMIN_PASSWORD`). Cópialos
manualmente desde el equipo de origen a las mismas rutas en el nuevo equipo (por
ejemplo, por USB o un servicio de archivos propio) — no van a través de git ni de este
chat. Si prefieres no migrarlos, usa `.env.example` como base y genera credenciales
nuevas (en ese caso ignora el dump de la sección 4 y corre `npm run seed:admin` en vez
de restaurarlo).

## 4. Base de datos

En el equipo de origen, generar el respaldo (ya se hizo una vez para esta migración,
archivo `personal_pymes_dump.sql`):

```bash
pg_dump -h localhost -p 5432 -U postgres -d personal_pymes --no-owner --no-privileges -F p -f personal_pymes_dump.sql
```

En el equipo nuevo, crear la base vacía y restaurar:

```bash
createdb -h localhost -p 5432 -U postgres personal_pymes
psql -h localhost -p 5432 -U postgres -d personal_pymes -f personal_pymes_dump.sql
```

Esto incluye la tabla `schema_migrations`, así que **no hace falta correr
`npm run migrate`** salvo que agregues una migración nueva después de la migración de
equipo.

## 5. Archivos subidos

La carpeta `backend/uploads/` (documentos de contratos, documentos del repositorio
RF-11 que no se subieron a Cloudinary, y los PDF de liquidaciones ya generados) **no
está en git** porque son datos, no código. Cópiala completa desde el equipo de origen a
la misma ruta (`backend/uploads/`) en el nuevo equipo — se incluyó un respaldo
`uploads_backup.zip` para esta migración; descomprímelo ahí.

## 6. Instalar y levantar

```bash
# Backend
cd backend
npm install
npm run dev        # http://localhost:4000

# Frontend (otra terminal)
cd frontend
npm install
npm run dev         # http://localhost:5173
```

Entra con las credenciales de `ADMIN_EMAIL`/`ADMIN_PASSWORD` del `.env` que copiaste.

## 7. Verificación rápida

- `GET http://localhost:4000/api/health` responde OK.
- El dashboard (`/`) muestra los mismos conteos de empleados/alertas que en el equipo
  de origen.
- Un documento de contrato o liquidación ya generado se puede descargar/ver sin error
  404 (confirma que `uploads/` se copió completo).
