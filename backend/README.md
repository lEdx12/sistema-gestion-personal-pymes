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
La restricción por rol (`administrador`/`gerente`) se agrega en `src/middleware/roles.js`
— ver RF-02 más abajo.

El primer usuario administrador se crea con:

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

RF-15 (filtros y paginación en los listados): los endpoints `GET` que listan una colección
(empleados, usuarios, asistencia, contratos, documentos, alertas y el historial de
liquidaciones) aceptan `?pagina=N&por_pagina=N` (por defecto página 1 de 10, máximo 100 por
página — `src/utils/paginacion.js`) y devuelven `{ datos, total, pagina, porPagina,
totalPaginas }` en vez de un arreglo plano. Cada recurso además admite sus propios filtros
(`texto` búsqueda en empleados/usuarios, `rol` en usuarios, `ausente` en asistencia, `tipo`
en documentos/alertas — ver la tabla de cada recurso). El historial de remuneraciones
(`GET /api/liquidaciones/historial`) es la excepción de forma: sus agregados (`cantidad`,
`totalLiquido`, `promedioLiquido`) se calculan sobre todo el rango filtrado, no solo sobre
la página actual — solo el arreglo `liquidaciones` viene paginado. Pruebas en
`tests/paginacion.test.js` y en los tests de cada recurso.

| Método | Ruta | Body | Respuesta |
|--------|------|------|-----------|
| GET | `/api/health` | — | `{ status: 'ok' }` — único endpoint además de `/api/auth/*` que no exige token |
| GET | `/api/empleados` | — (query opcional `?incluirInactivos=true&texto=...&pagina=N&por_pagina=N`) | `200` `{ datos, total, pagina, porPagina, totalPaginas }` (activos por defecto; `texto` busca en rut/nombre/apellido/cargo) |
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
| GET | `/api/contratos` | — (query opcional `?empleado_id=N&pagina=N&por_pagina=N`) | `200` `{ datos, total, pagina, porPagina, totalPaginas }` |
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
| GET | `/api/asistencia` | — (query opcional `?empleado_id=N&desde=YYYY-MM-DD&hasta=YYYY-MM-DD&ausente=true\|false&pagina=N&por_pagina=N`) | `200` `{ datos, total, pagina, porPagina, totalPaginas }` |
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
PDF con `pdfkit`, en el formato clásico de una liquidación de sueldo chilena (encabezado
con datos de la empresa/trabajador/contrato, resumen de días e imponible, dos columnas
de haberes y descuentos, totales, y el líquido a pagar escrito en palabras con
`src/utils/numeroALetras.js`) en vez de un resumen vertical simple, a pedido explícito
del cliente. Se genera una sola vez por liquidación — la primera descarga lo crea en
`backend/uploads/liquidaciones/` y guarda la ruta en `pdf_url`; las siguientes descargas
reutilizan ese archivo en vez de regenerarlo (una liquidación ya generada es inmutable,
no tiene sentido recalcular el PDF). Mismo enfoque de almacenamiento local que RF-04 (se
migrará a Cloud Storage en RF-11).

La razón social/RUT de la empresa y los nombres de la AFP e institución de salud que
aparecen impresos son texto configurable vía `.env` (`EMPRESA_RAZON_SOCIAL`,
`EMPRESA_RUT`, `AFP_NOMBRE`, `SALUD_NOMBRE`) — el sistema es de una sola PyME y no
registra a qué AFP/Isapre está afiliado cada trabajador (sección 4 de `PROJECT.md` no
modela eso), así que es solo texto del comprobante, no afecta ningún cálculo; los
porcentajes mostrados sí son los configurados para AFP/salud (`DESCUENTO_AFP_PORCENTAJE`,
`DESCUENTO_SALUD_PORCENTAJE`, ver RF-09). El tipo y fecha de término de contrato
corresponden al contrato más reciente del empleado (no hay vínculo liquidación↔contrato
en el esquema). Pruebas en `tests/liquidaciones.test.js` y `tests/numeroALetras.test.js`
(incluye el mismo monto de un comprobante real como caso de referencia).

| Método | Ruta | Query | Respuesta |
|--------|------|-------|-----------|
| GET | `/api/liquidaciones/historial` | `empleado_id` (obligatorio) + `desde`/`hasta` opcionales (`YYYY-MM`) + `pagina`/`por_pagina` opcionales | `200` `{ empleado, desde, hasta, cantidad, totalLiquido, promedioLiquido, liquidaciones, pagina, porPagina, totalPaginas }` (agregados sobre todo el rango, `liquidaciones` paginado) / `400` / `404` |

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
| GET | `/api/asistencia/reporte-mensual/pdf` | mismos parámetros | `200` descarga el PDF del mismo reporte (`Content-Type: application/pdf`) / `400` / `404` |
| GET | `/api/empleados/selector` | — | `200` lista acotada `[{ id, rut, nombre, apellido }]` de empleados activos, sin sueldo ni otros datos sensibles |

RF-12 (reporte de asistencia mensual): un mismo endpoint cubre los dos casos del RF.
Con `empleado_id` devuelve `{ periodo, empleado, diasTrabajados, diasAusentes,
totalHoras, horasSobrejornada, registros }` (el detalle día a día). Sin `empleado_id`
devuelve `{ periodo, empleados: [...] }`, una fila por cada empleado activo con el
mismo resumen. `src/utils/periodo.js` (nuevo, compartido con RF-09) centraliza
`esPeriodoValido`, `rangoDelPeriodo` y `obtenerBloquesSemanalesDelPeriodo` — antes
`obtenerBloquesSemanalesDelPeriodo` vivía duplicada en `liquidacionCalculo.service.js`;
se refactorizó a este módulo al necesitarla de nuevo aquí. La sobrejornada se calcula
igual que en RF-09 (por bloques semanales de 7 días, no sobre el mes completo).

`GET /api/asistencia/reporte-mensual/pdf` (`src/services/reporteAsistenciaPdf.service.js`)
arma el mismo reporte en PDF con `pdfkit`. A diferencia de la liquidación (RF-10), el
reporte no es un documento inmutable — se recalcula de la asistencia vigente cada vez —
así que no se guarda en disco ni se cachea: se arma al vuelo y se transmite directo a la
respuesta HTTP (`doc.pipe(res)`).

`GET /api/empleados/selector` existe porque el Gerente no puede listar `/api/empleados`
(RF-02) pero sí necesita elegir a quién verle el reporte individual: devuelve solo
`id/rut/nombre/apellido` de los empleados activos, sin sueldo, dirección ni otros datos
que están fuera de su alcance de "solo lectura de reportes".

Frontend: página `/reportes/asistencia`, con selector de empleado ("Todos" = vista
consolidada), período y botón "Descargar PDF"; accesible desde la barra de navegación y
desde la página de asistencia de cada empleado. Pruebas en `tests/periodo.test.js` y
`tests/reporteMensual.test.js`.

RF-02 (gestión de roles — **Sprint 3**): `permitirRoles(...roles)`
(`src/middleware/roles.js`) se monta después de `auth.js` y devuelve `403` si
`req.user.rol` no está en la lista. Matriz de permisos (sección 3 de `PROJECT.md`):
`administrador` tiene acceso completo a todos los módulos; `gerente` solo puede leer
reportes, liquidaciones e historial de remuneraciones, es decir:

| Módulo | Administrador | Gerente |
|--------|----------------|---------|
| `/api/empleados` (ficha completa) | CRUD completo | sin acceso (`403`) |
| `GET /api/empleados/selector` (solo id/rut/nombre) | sí | sí (solo lectura) |
| `/api/contratos` | CRUD completo | sin acceso (`403`) |
| `/api/asistencia` (marcaje, edición, resumen semanal) | CRUD completo | sin acceso (`403`) |
| `GET /api/asistencia/reporte-mensual` y `/pdf` | sí | sí (solo lectura) |
| `GET /api/liquidaciones`, `/historial`, `/:id`, `/:id/pdf` | sí | sí (solo lectura) |
| `POST /api/liquidaciones` (generar) | sí | sin acceso (`403`) |
| `/api/usuarios` (RF-14) | CRUD completo | sin acceso (`403`) |

Frontend: `RequireRole` (`src/components/RequireRole.jsx`) oculta del lado del cliente
las rutas que el backend ya rechaza para el rol del usuario autenticado (redirige a
`/`), y la barra de navegación/los formularios de "generar liquidación" también se
ajustan según `usuario.rol`. Pruebas en `tests/roles.test.js`.

| Método | Ruta | Body | Respuesta |
|--------|------|------|-----------|
| GET | `/api/usuarios` | — (query opcional `?incluirInactivos=true&texto=...&rol=administrador\|gerente&pagina=N&por_pagina=N`) | `200` `{ datos, total, pagina, porPagina, totalPaginas }` (activos por defecto, sin `password_hash`; `texto` busca en nombre/email) |
| GET | `/api/usuarios/:id` | — | `200` usuario / `404` |
| POST | `/api/usuarios` | `{ nombre, email, password, rol }` (`rol`: `administrador`\|`gerente`, `password` ≥ 8 caracteres) | `201` usuario creado / `400` validación / `409` email ya registrado |
| PUT | `/api/usuarios/:id` | `{ nombre, email, rol }` | `200` actualizado / `400` / `404` / `409` email ya usado por otro usuario |
| PUT | `/api/usuarios/:id/password` | `{ password }` | `204` / `400` / `404` — la deja marcada como genérica (`debe_cambiar_password = true`) |
| PUT | `/api/usuarios/:id/desactivar` | — | `200` usuario con `activo: false` (no puede volver a loguearse) / `404` |
| PUT | `/api/usuarios/:id/reactivar` | — | `200` usuario con `activo: true` / `404` |
| PUT | `/api/usuarios/me/password` | `{ password }` | `204` / `400` — self-service, cualquier rol autenticado; deja `debe_cambiar_password = false` |

RF-14 (gestión de usuarios del sistema): salvo `PUT /api/usuarios/me/password`, todos
los endpoints exigen rol `administrador` (ver matriz de RF-02). `src/models/usuario.model.js`
nunca devuelve `password_hash` salvo en `findByEmailConHash`, usado únicamente por el
login y por la validación de email duplicado. Las contraseñas se hashean con `bcrypt`
(10 rounds), igual que en `seedAdmin.js`. Frontend: página `/usuarios` (enlace
"Usuarios" en la barra de navegación, visible solo para `administrador`). Pruebas en
`tests/usuarios.test.js`.

**Cambio de contraseña obligatorio en el primer login (migración `002`):** la columna
`usuarios.debe_cambiar_password` (default `TRUE`) queda en `true` para toda cuenta
nueva (`POST /api/usuarios`, `npm run seed:admin`) y para toda contraseña que
restablece un Administrador vía `PUT /api/usuarios/:id/password` — en ambos casos la
contraseña es "genérica", asignada por otra persona. Solo pasa a `false` cuando el
propio usuario la cambia con `PUT /api/usuarios/me/password`. `POST /api/auth/login`
devuelve este campo en `usuario.debe_cambiar_password`; el frontend
(`RequireAuth.jsx`) redirige a `/cambiar-password` — una pantalla fuera del layout
normal, sin acceso a ninguna otra ruta — hasta que se complete el cambio. Pensado para
que el administrador inicial (credenciales de `.env`/`seedAdmin.js`) y cualquier
cuenta nueva no sigan usando indefinidamente una contraseña que otra persona conoce.
Pruebas en `tests/usuarios.test.js` (login tras crear usuario, tras restablecer, y el
flujo self-service con un Gerente).

| Método | Ruta | Query/Body | Respuesta |
|--------|------|------------|-----------|
| GET | `/api/alertas` | query opcional `?soloNoLeidas=true&tipo=...&pagina=N&por_pagina=N` | `200` `{ datos, total, pagina, porPagina, totalPaginas }` (con datos del empleado), más recientes primero |
| PUT | `/api/alertas/:id/leida` | — | `200` alerta con `leida: true` / `404` |
| POST | `/api/alertas/generar` | — | `201` lista de alertas recién creadas en esta corrida (puede ser vacía) |

RF-05 (alertas de vencimiento de contratos — **Sprint 4**): `src/services/alertas.service.js`
revisa los contratos `plazo_fijo` activos cuyo `fecha_termino` cae dentro de
`ALERTA_DIAS_ANTICIPACION` días desde hoy (default 30, configurable, incluye los ya
vencidos) y crea una alerta por cada uno que todavía no tenga una — así el job puede
correr todos los días sin duplicar avisos. **No se usa un scheduler en memoria
(node-cron)**: acoplar el "job diario" al proceso del servidor web duplicaría la
ejecución si hay más de una instancia corriendo, y no es portable entre
Render/Railway/un VPS (RNF-08). En su lugar, `npm run job:alertas`
(`src/jobs/generarAlertasVencimiento.js`) es un script independiente pensado para
invocarse una vez al día desde un scheduler externo (Render Cron Jobs, Railway Cron, o
un crontab de sistema); `POST /api/alertas/generar` expone la misma lógica por API para
poder probarla o dispararla manualmente desde el frontend sin depender de ese
scheduler. Frontend: página `/alertas` (enlace "Alertas" en la barra de navegación,
solo para `administrador`, igual que empleados/contratos/usuarios — ver matriz de
RF-02). Pruebas en `tests/alertas.test.js`.

| Método | Ruta | Query/Body | Respuesta |
|--------|------|------------|-----------|
| GET | `/api/documentos` | query `empleado_id` (obligatorio) + `tipo`/`pagina`/`por_pagina` opcionales | `200` `{ datos, total, pagina, porPagina, totalPaginas }` del empleado, más reciente primero / `400` / `404` empleado no existe |
| POST | `/api/documentos` | `multipart/form-data`: `empleado_id`, campo `documento` (PDF/PNG/JPG, máx. 10MB), `tipo?` (texto libre) | `201` documento creado / `400` validación o tipo de archivo no permitido / `404` empleado no existe |
| DELETE | `/api/documentos/:id` | — | `204` / `404` |

RF-11 (repositorio de documentos — **Sprint 4**): a diferencia del documento de
contrato (RF-04) y el PDF de liquidación (RF-10), que quedaron en disco local como
solución provisional, este RF integra el Cloud Storage real que define la sección 2
de `PROJECT.md`. `src/services/almacenamiento.service.js` es la única pieza que sabe
dónde vive un archivo: si `CLOUDINARY_URL` está configurado en el entorno, sube a
Cloudinary (plan gratuito); si no, cae a disco local
(`backend/uploads/documentos`, servido vía `/uploads`) **sin necesidad de crear una
cuenta externa** para desarrollar o correr los tests (RNF-08: portabilidad, ningún
proveedor hardcodeado). El multer de este endpoint usa almacenamiento en memoria
(`src/middleware/uploadDocumento.js`) en vez de disco, para poder entregarle el buffer
a `almacenamiento.service.js` sin importar el destino final. Al eliminar un documento
también se intenta borrar el archivo subyacente (best-effort: si falla, igual se borra
la fila en BD). Frontend: página `/empleados/:id/documentos` (enlace "Documentos" en
la ficha de cada empleado), exclusiva de Administrador (RF-02). Pruebas en
`tests/documentos.test.js` (corren contra el fallback local, ya que el entorno de
tests no tiene credenciales de Cloudinary).

Cada nuevo RF debe agregar su tabla de endpoints aquí (método, ruta, body esperado,
respuesta) al completarse.

## Scripts

- `npm run dev` — servidor con nodemon
- `npm start` — servidor en modo producción
- `npm run migrate` — aplica migraciones pendientes
- `npm test` — pruebas Jest/Supertest
- `npm run lint` — ESLint
