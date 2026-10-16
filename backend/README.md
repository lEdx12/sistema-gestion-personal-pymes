# Backend — Sistema de Gestión de Personal para PyMES

Node.js + Express + PostgreSQL (vía `pg`, sin ORM — ver decisión abajo).

## Setup

```bash
cp .env.example .env   # ajustar credenciales de PostgreSQL y ADMIN_*
npm install
npm run migrate        # aplica backend/migrations/*.sql
npm run seed:admin     # crea el usuario administrador inicial (RF-01)
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

## Autenticación (RF-01, Sprint 2)

El `mockAuth` del Sprint 1 fue reemplazado por autenticación JWT real
(`src/middleware/auth.js`). **Toda ruta bajo `/api/` exige un header
`Authorization: Bearer <token>` válido, excepto `/api/health` y `/api/auth/*`.**
No hay restricción por rol todavía — cualquier usuario autenticado (`administrador` o
`gerente`) puede usar cualquier endpoint; eso es RF-02 (Sprint 3).

Como RF-14 (CRUD de usuarios) tampoco existe todavía, no hay forma de crear una cuenta
desde la UI. El primer usuario administrador se crea con:

```bash
# Definir ADMIN_EMAIL / ADMIN_NOMBRE / ADMIN_PASSWORD en backend/.env primero
npm run seed:admin
```

Es idempotente — se puede volver a ejecutar para rotar la contraseña del admin. El
`password_hash` se calcula con `bcrypt` (nunca se guarda ni se devuelve la contraseña
en texto plano).

| Método | Ruta | Body | Respuesta |
|--------|------|------|-----------|
| POST | `/api/auth/login` | `{ email, password }` | `200` `{ token, usuario }` / `400` faltan campos / `401` credenciales inválidas o usuario inactivo |
| POST | `/api/auth/logout` | — | `200` — JWT no tiene estado en el servidor; "cerrar sesión" es que el cliente descarte el token. Este endpoint existe por simetría con `/login`. |

## Endpoints

| Método | Ruta | Body | Respuesta |
|--------|------|------|-----------|
| GET | `/api/health` | — | `{ status: 'ok' }` — único endpoint además de `/api/auth/*` que no exige token |
| GET | `/api/empleados` | — (query opcional `?incluirInactivos=true`) | `200` lista de empleados (activos por defecto) |
| GET | `/api/empleados/:id` | — | `200` empleado / `404` si no existe |
| POST | `/api/empleados` | `{ rut, nombre, apellido, fecha_ingreso, sueldo_base, fecha_nacimiento?, direccion?, telefono?, email?, cargo? }` | `201` empleado creado / `400` validación (campo obligatorio o RUT inválido) / `409` "Empleado ya registrado" si el RUT ya existe |
| PUT | `/api/empleados/:id` | mismos campos que POST (sin `rut`) | `200` empleado actualizado / `400` / `404` |
| PUT | `/api/empleados/:id/desactivar` | — | `200` empleado con `activo: false` / `404` |
| PUT | `/api/empleados/:id/reactivar` | — | `200` empleado con `activo: true` / `404` |

RF-03 (registro de empleados): validación de RUT chileno (dígito verificador, módulo 11)
en `src/utils/rut.js`, reglas de negocio en `src/services/empleados.service.js`, acceso a
datos en `src/models/empleado.model.js`. Un empleado desactivado puede reactivarse con
`PUT /api/empleados/:id/reactivar` (vuelve a aparecer en el listado por defecto). Pruebas
en `tests/rut.test.js` y `tests/empleados.test.js` (incluye CP-03: RUT duplicado).

**Fecha de ingreso vs. fecha de nacimiento (actualizado):** el formulario del frontend ya
no pide ni muestra `fecha_ingreso` — se fija automáticamente a la fecha del computador
donde se registra el empleado (y se conserva sin cambios al editar). El campo de fecha
visible en el formulario es `fecha_nacimiento` (opcional). El backend no cambió: ambas
columnas ya existían y `actualizarEmpleado` sigue exigiendo `fecha_ingreso`, solo que
ahora el frontend la completa por sí mismo en vez de pedirla.

| Método | Ruta | Body | Respuesta |
|--------|------|------|-----------|
| GET | `/api/contratos` | — (query opcional `?empleado_id=N`) | `200` lista de contratos |
| GET | `/api/contratos/:id` | — | `200` contrato / `404` |
| POST | `/api/contratos` | `{ empleado_id, tipo, fecha_inicio, fecha_termino?, documento_url? }` | `201` creado / `400` validación / `404` empleado no existe / `409` empleado ya tiene contrato activo |
| PUT | `/api/contratos/:id` | mismos campos que POST (sin `empleado_id`) | `200` actualizado / `400` / `404` |
| PUT | `/api/contratos/:id/renovar` | `{ tipo, fecha_inicio, fecha_termino? }` del nuevo contrato | `201` nuevo contrato activo (cierra el anterior, transacción atómica) / `400` / `404` |
| POST | `/api/contratos/:id/documento` | `multipart/form-data`, campo `documento` (PDF/PNG/JPG, máx. 10MB) | `200` contrato con `documento_url` actualizado / `400` validación o tipo no permitido / `404` contrato no existe |

RF-04 (gestión de contratos): `tipo` debe ser `indefinido` o `plazo_fijo`; si es
`plazo_fijo`, `fecha_termino` es obligatoria y debe ser posterior a `fecha_inicio`. Un
empleado solo puede tener un contrato activo a la vez — para reemplazarlo se usa
`renovar`, que cierra el contrato vigente (`activo=false`, `fecha_termino` = inicio del
nuevo) y crea el siguiente dentro de la misma transacción de BD
(`src/services/contratos.service.js`). La subida de documentos usa `multer` con
almacenamiento en disco local (`backend/uploads/contratos`, servido vía `/uploads` —
ver `src/middleware/uploadContrato.js`); esto es una solución provisional de bajo costo
para esta etapa, se migrará a Cloud Storage (Cloudinary/S3) al implementar RF-11. Pruebas
en `tests/contratos.test.js`.

| Método | Ruta | Body | Respuesta |
|--------|------|------|-----------|
| GET | `/api/asistencia` | — (query opcional `?empleado_id=N&desde=YYYY-MM-DD&hasta=YYYY-MM-DD`) | `200` lista de registros |
| GET | `/api/asistencia/:id` | — | `200` registro / `404` |
| POST | `/api/asistencia/entrada` | `{ empleado_id, fecha, hora_entrada }` | `201` registro creado / `400` validación / `404` empleado no existe / `409` ya existe registro para esa fecha |
| PUT | `/api/asistencia/:id/salida` | `{ hora_salida }` | `200` registro actualizado / `400` si es igual a la entrada o falta entrada / `409` ya tiene salida marcada / `404` |
| POST | `/api/asistencia/ausencia` | `{ empleado_id, fecha, justificacion }` | `201` registro creado (`ausente: true`) / `400` / `404` / `409` |
| PUT | `/api/asistencia/:id` | `{ hora_entrada?, hora_salida?, ausente?, justificacion? }` | `200` registro corregido (recalcula `horas_trabajadas`) / `400` / `404` |

RF-06 (registro de asistencia): un registro único por empleado/fecha (constraint
`UNIQUE` de la tabla). `PUT /api/asistencia/:id` permite corregir un registro ya
creado (error de tipeo en la hora, cambiar a ausencia, editar la justificación) sin
tocar `fecha` ni `empleado_id`, para no romper esa unicidad. Pruebas en
`tests/horas.test.js` y `tests/asistencia.test.js`.

**Turnos nocturnos (actualizado):** la hora de salida puede ser cualquier hora, incluso
numéricamente anterior a la de entrada — se interpreta como un turno que cruza la
medianoche (ej. entrada 22:00, salida 06:00 → 8 horas). Esto reemplaza la validación
original de CP-11 (sección 12 de `PROJECT.md`, que rechazaba `hora_salida < hora_entrada`)
a pedido explícito del dueño de producto; lo único que se rechaza ahora es una salida
igual a la entrada (duración ambigua). Ver `calcularHorasTrabajadas` en
`src/services/horasTrabajadas.service.js`.

| Método | Ruta | Body / Query | Respuesta |
|--------|------|---------------|-----------|
| GET | `/api/asistencia/resumen-semanal` | query `empleado_id, desde, hasta` (obligatorios) | `200` `{ totalHoras, horasSobrejornada, jornadaMaxHoras }` / `400` / `404` |

RF-07 (cálculo de horas trabajadas): `src/services/horasTrabajadas.service.js` expone
`calcularHorasTrabajadas(horaEntrada, horaSalida)` (función pura) y
`calcularSobrejornadaSemanal(horasPorDia, jornadaMaxHoras?)`. Al marcar la salida
(`PUT /api/asistencia/:id/salida`) se calculan y persisten automáticamente las
`horas_trabajadas` del día. La jornada ordinaria semanal es configurable vía
`JORNADA_SEMANAL_MAX_HORAS` (default 45h, Art. 32 Código del Trabajo — **no
hardcodeada**, ver sección 5 de `PROJECT.md`). Pruebas en `tests/horasTrabajadas.test.js`
(incluye CP-05: 50h trabajadas → 5h de sobrejornada).

RF-08 (cálculo de horas extra): `src/services/horasExtra.service.js` expone
`calcularValorHoraOrdinaria(sueldoBase, horasMensuales?)` y
`calcularMontoHorasExtra(horasExtra, valorHoraOrdinaria, recargo?)` (funciones puras).
El recargo (default 50%, `RECARGO_HORA_EXTRA`) y las horas mensuales de jornada usadas
para el valor hora (default 180, `HORAS_MENSUALES_JORNADA`) son configurables — **no
hardcodeados**. `GET /api/asistencia/resumen-semanal` ahora también devuelve
`valorHoraOrdinaria` y `montoHorasExtra`, usando el `sueldo_base` del empleado. Pruebas
en `tests/horasExtra.test.js` (incluye CP-05 completo: 5h extra → $37.500 con sueldo
base $900.000 y recargo 50%).

| Método | Ruta | Body / Query | Respuesta |
|--------|------|---------------|-----------|
| GET | `/api/liquidaciones` | — (query opcional `?empleado_id=N&periodo=YYYY-MM`) | `200` lista de liquidaciones |
| GET | `/api/liquidaciones/:id` | — | `200` liquidación / `404` |
| POST | `/api/liquidaciones` | `{ empleado_id, periodo }` (`periodo` formato `YYYY-MM`) | `201` liquidación generada / `400` validación, formato de período o sin contrato activo / `404` empleado no existe / `409` ya existe liquidación para ese período |

RF-09 (generación de liquidaciones — **Sprint 2**): orquesta RF-07/RF-08 y las
cotizaciones/gratificación legales. `src/services/liquidacionCalculo.service.js` tiene
las funciones puras (`calcularGratificacion`, `calcularDescuentoAfp`,
`calcularDescuentoSalud`, `calcularDescuentoCesantia`,
`obtenerBloquesSemanalesDelPeriodo`); `src/services/liquidaciones.service.js` orquesta:
busca el contrato activo del empleado (requerido — si no tiene, `400`), suma la
sobrejornada del período completo dividiéndolo en bloques de 7 días y aplicando
`calcularSobrejornadaSemanal` (RF-07) a cada bloque, calcula el monto de horas extra
(RF-08), la gratificación (25% de sueldo base + horas extra, con tope mensual), y las
cotizaciones (AFP, salud, cesantía — esta última según el tipo de contrato: un
trabajador con contrato a plazo fijo no cotiza cesantía). Todos los porcentajes/topes
son configurables vía `.env` y están marcados `// TODO: validar valor legal vigente`
— son valores de referencia, no específicos por AFP/Isapre de cada trabajador.
`generado_por` guarda el id del usuario autenticado que generó la liquidación (RF-01,
implementado en Sprint 2 — antes quedaba en `null`).
Un empleado/período solo puede liquidarse una vez (constraint `UNIQUE`). Pruebas en
`tests/liquidacionCalculo.test.js` y `tests/liquidaciones.test.js` (incluye CP-06:
sueldo base $500.000 sin horas extra → gratificación $125.000, AFP $62.500, salud
$43.750, cesantía $3.750, líquido a pagar $515.000).

| Método | Ruta | Respuesta |
|--------|------|-----------|
| GET | `/api/liquidaciones/:id/pdf` | `200` descarga el PDF (`Content-Type: application/pdf`, `Content-Disposition: attachment`) / `404` si la liquidación no existe |

RF-10 (descarga de liquidación en PDF): `src/services/liquidacionPdf.service.js` arma el
PDF con `pdfkit` (haberes, descuentos y líquido a pagar). Se genera una sola vez por
liquidación — la primera descarga lo crea en `backend/uploads/liquidaciones/` y guarda
la ruta en `pdf_url`; las siguientes descargas reutilizan ese archivo en vez de
regenerarlo (una liquidación ya generada es inmutable, no tiene sentido recalcular el
PDF). Mismo enfoque de almacenamiento local que RF-04 (se migrará a Cloud Storage en
RF-11). Pruebas en `tests/liquidaciones.test.js`.

| Método | Ruta | Query | Respuesta |
|--------|------|-------|-----------|
| GET | `/api/liquidaciones/historial` | `empleado_id` (obligatorio) + `desde`/`hasta` opcionales (`YYYY-MM`) | `200` `{ empleado, desde, hasta, cantidad, totalLiquido, promedioLiquido, liquidaciones }` / `400` / `404` |

RF-13 (historial de remuneraciones): filtra por rango de períodos sobre la misma tabla
`liquidaciones` — como `periodo` es `VARCHAR` con formato fijo `YYYY-MM`, la comparación
lexicográfica (`periodo >= $desde AND periodo <= $hasta`) equivale a la cronológica, sin
necesidad de castear a fecha. `GET /api/liquidaciones` (RF-09) también acepta `desde`/
`hasta` ahora, para reuso interno; `/historial` es el endpoint pensado para esta
pantalla, que además agrega `cantidad`, `totalLiquido` y `promedioLiquido` del rango.
Frontend: la página de liquidaciones de cada empleado ahora tiene un formulario
"Filtrar historial por fecha" (Desde/Hasta) además del de generar, y muestra el
resumen agregado sobre la tabla. Pruebas en `tests/historialRemuneraciones.test.js`.

| Método | Ruta | Query | Respuesta |
|--------|------|-------|-----------|
| GET | `/api/asistencia/reporte-mensual` | `periodo` (obligatorio, `YYYY-MM`) + `empleado_id` opcional | `200` reporte individual (con `empleado_id`) o consolidado (sin él) / `400` / `404` |

RF-12 (reporte de asistencia mensual): un mismo endpoint cubre los dos casos del RF.
Con `empleado_id` devuelve `{ periodo, empleado, diasTrabajados, diasAusentes,
totalHoras, horasSobrejornada, registros }` (el detalle día a día). Sin `empleado_id`
devuelve `{ periodo, empleados: [...] }`, una fila por cada empleado activo con el
mismo resumen. `src/utils/periodo.js` (nuevo, compartido con RF-09) centraliza
`esPeriodoValido`, `rangoDelPeriodo` y `obtenerBloquesSemanalesDelPeriodo` — antes
`obtenerBloquesSemanalesDelPeriodo` vivía duplicada en `liquidacionCalculo.service.js`;
se refactorizó a este módulo al necesitarla de nuevo aquí. La sobrejornada se calcula
igual que en RF-09 (por bloques semanales de 7 días, no sobre el mes completo).
Frontend: página `/reportes/asistencia`, con selector de empleado ("Todos" = vista
consolidada) y período; accesible desde la barra de navegación y desde la página de
asistencia de cada empleado. Pruebas en `tests/periodo.test.js` y
`tests/reporteMensual.test.js`.

Cada nuevo RF debe agregar su tabla de endpoints aquí (método, ruta, body esperado,
respuesta) al completarse.

## Scripts

- `npm run dev` — servidor con nodemon
- `npm start` — servidor en modo producción
- `npm run migrate` — aplica migraciones pendientes
- `npm test` — pruebas Jest/Supertest
- `npm run lint` — ESLint
