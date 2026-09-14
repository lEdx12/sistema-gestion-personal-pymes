# Sistema de Gestión de Personal para PyMES

## 1. Contexto del Proyecto

Plataforma web para automatizar la gestión de personal en pequeñas y medianas empresas (PyMES) chilenas con dotaciones de **16 a 50 empleados**. Es un Trabajo de Título de Ingeniería en Computación e Informática (UNAB).

**Problema que resuelve:** las PyMES gestionan su personal con Excel, papel y procesos manuales, lo que genera errores en liquidaciones de sueldo, incumplimiento del Código del Trabajo chileno y sobrecarga administrativa sobre una sola persona.

**Objetivo general:** desarrollar una plataforma web que centralice y automatice la gestión de empleados y contratos, el control de asistencia y la liquidación de sueldos, priorizando una interfaz simple que no requiera conocimientos técnicos para su operación.

**Alcance de esta versión (fuera de alcance por ahora):** sin módulo CRM, sin evaluación de desempeño, sin dashboards analíticos avanzados, sin app móvil nativa.

---

## 2. Stack Tecnológico

| Capa | Tecnología | Notas |
|------|------------|-------|
| Frontend | **React.js** (SPA) | Consumo de API REST vía Axios, React Router para navegación entre módulos |
| Backend | **Node.js + Express.js** | API RESTful |
| Base de datos | **PostgreSQL** | Relacional, transacciones ACID |
| Autenticación | **JWT** + **bcrypt** | Tokens con duración máx. 8 horas, contraseñas hasheadas |
| Generación de PDF | pdfkit o puppeteer | Liquidaciones y contratos |
| Almacenamiento de archivos | Cloud Storage (Cloudinary / AWS S3) | Documentos digitalizados, PDFs generados |
| Testing | **Jest** (unitarias) + **Supertest** (integración API) | |
| Control de versiones | Git + GitHub, modelo **Git Flow** | ramas `feature/*`, `develop`, `main` |
| Entorno de desarrollo | Visual Studio Code, ESLint, Prettier | |
| Despliegue sugerido | Render / Railway (backend), Supabase / ElephantSQL (Postgres) | Todo mediante variables de entorno, sin costo o bajo costo |

**Restricciones de arquitectura:**
- Solo tecnologías de código abierto o de nivel gratuito/bajo costo.
- Aplicación 100% web (sin app nativa).
- Tiempo de respuesta objetivo: **< 3 segundos** con hasta 10 usuarios concurrentes.
- Disponibilidad objetivo: 99% en horario laboral (lun-vie 08:00–20:00).
- Cumplimiento de la Ley N° 19.628 (protección de datos personales) — usar datos ficticios/anonimizados en desarrollo y pruebas.

---

## 3. Actores del Sistema

Solo dos roles en esta versión (sin perfil de "Empleado" autoservicio todavía):

1. **Administrador** (encargado de RRHH): acceso completo a todos los módulos.
2. **Gerente / Dueño**: acceso de solo lectura a reportes, liquidaciones e historial de remuneraciones.

---

## 4. Modelo de Base de Datos (PostgreSQL)

```sql
-- usuarios: cuentas de acceso al sistema (Admin / Gerente)
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('administrador', 'gerente')),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- empleados: ficha del trabajador de la PyME
CREATE TABLE empleados (
  id SERIAL PRIMARY KEY,
  rut VARCHAR(12) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  fecha_nacimiento DATE,
  direccion VARCHAR(200),
  telefono VARCHAR(20),
  email VARCHAR(100),
  fecha_ingreso DATE NOT NULL,
  cargo VARCHAR(100),
  sueldo_base DECIMAL(12,2) NOT NULL,
  activo BOOLEAN DEFAULT TRUE
);

-- contratos: relación 1:N con empleados
CREATE TABLE contratos (
  id SERIAL PRIMARY KEY,
  empleado_id INT NOT NULL REFERENCES empleados(id),
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('indefinido', 'plazo_fijo')),
  fecha_inicio DATE NOT NULL,
  fecha_termino DATE, -- NULL si es indefinido
  documento_url VARCHAR(255),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- asistencia: marcaje diario
CREATE TABLE asistencia (
  id SERIAL PRIMARY KEY,
  empleado_id INT NOT NULL REFERENCES empleados(id),
  fecha DATE NOT NULL,
  hora_entrada TIME,
  hora_salida TIME,
  horas_trabajadas DECIMAL(5,2),
  horas_extra DECIMAL(5,2) DEFAULT 0,
  ausente BOOLEAN DEFAULT FALSE,
  justificacion TEXT,
  UNIQUE (empleado_id, fecha)
);

-- liquidaciones: cálculo mensual de sueldo
CREATE TABLE liquidaciones (
  id SERIAL PRIMARY KEY,
  empleado_id INT NOT NULL REFERENCES empleados(id),
  generado_por INT REFERENCES usuarios(id),
  periodo VARCHAR(7) NOT NULL, -- formato 'YYYY-MM'
  sueldo_base DECIMAL(12,2) NOT NULL,
  horas_extra_monto DECIMAL(12,2) DEFAULT 0,
  gratificacion DECIMAL(12,2) DEFAULT 0,
  descuento_afp DECIMAL(12,2) DEFAULT 0,
  descuento_salud DECIMAL(12,2) DEFAULT 0,
  descuento_cesantia DECIMAL(12,2) DEFAULT 0,
  otros_descuentos DECIMAL(12,2) DEFAULT 0,
  total_haberes DECIMAL(12,2) NOT NULL,
  total_descuentos DECIMAL(12,2) NOT NULL,
  liquido_pagar DECIMAL(12,2) NOT NULL,
  pdf_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (empleado_id, periodo)
);

-- alertas: vencimientos de contrato, etc.
CREATE TABLE alertas (
  id SERIAL PRIMARY KEY,
  empleado_id INT REFERENCES empleados(id),
  contrato_id INT REFERENCES contratos(id),
  tipo VARCHAR(30) NOT NULL,
  mensaje TEXT,
  fecha_alerta DATE NOT NULL,
  leida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- documentos: archivos adjuntos a un empleado
CREATE TABLE documentos (
  id SERIAL PRIMARY KEY,
  empleado_id INT NOT NULL REFERENCES empleados(id),
  nombre VARCHAR(150),
  tipo VARCHAR(50),
  url VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 5. Reglas de Negocio Clave (Chile — Código del Trabajo)

Estas reglas son las más sensibles del sistema porque tienen valor legal. Implementarlas con pruebas unitarias exhaustivas.

- **Jornada ordinaria:** 45 horas semanales (referencia general; validar con la ley vigente al momento de implementar).
- **Horas extra (Art. 32):** toda hora trabajada por sobre la jornada ordinaria se paga con un **recargo mínimo del 50%** sobre el valor de la hora ordinaria.
- **Gratificación legal (Art. 47):** debe calcularse conforme a la normativa vigente (25% de lo devengado en el mes por concepto de remuneraciones, con tope legal — verificar tope actualizado).
- **Cotizaciones previsionales:**
  - AFP: ~10% + comisión variable según la administradora.
  - Salud: 7% (Fonasa o Isapre).
  - Seguro de cesantía (AFC Chile): tasa según tipo de contrato (indefinido vs. plazo fijo tienen tasas distintas para trabajador y empleador).
- **Liquidación de sueldo = Total haberes − Total descuentos.** Debe emitirse en PDF con el formato exigido por la Dirección del Trabajo.

> ⚠️ Nota para el desarrollador/agente: estos porcentajes y topes cambian por ley. No hardcodear valores sin dejarlos configurables (tabla de parámetros o variables de entorno), tal como se define en el requerimiento RNF de mantenibilidad.

---

## 6. Requerimientos Funcionales (14) — orden de implementación recomendado

El orden sigue el flujo de negocio: primero la base de datos y la integración full-stack, luego lo que depende de ella.

| # | ID | Requerimiento | Complejidad |
|---|-----|----------------|--------------|
| 1 | RF-03 | Registro de empleados (CRUD + validación de RUT) | Alta |
| 2 | RF-04 | Gestión de contratos (relación 1:N con empleado) | Media |
| 3 | RF-06 | Registro de asistencia (entrada/salida diaria) | Media |
| 4 | RF-07 | Cálculo de horas trabajadas (detección de sobrejornada) | Alta |
| 5 | RF-08 | Cálculo de horas extra (Art. 32, recargo 50%) | Alta |
| 6 | RF-09 | Generación de liquidaciones de sueldo (orquesta RF-07/08 + AFP/salud/cesantía/gratificación) | Muy Alta |
| 7 | RF-10 | Descarga de liquidación en PDF | Baja |
| 8 | RF-12 | Reporte de asistencia mensual (individual y consolidado) | Baja |
| 9 | RF-13 | Historial de remuneraciones (consulta con filtro de fechas) | Baja |
| 10 | RF-01 | Autenticación de usuarios (JWT, login/logout) | Alta |
| 11 | RF-02 | Gestión de roles (Administrador / Gerente, middleware de autorización) | Media |
| 12 | RF-14 | Gestión de usuarios del sistema (CRUD de cuentas) | Baja |
| 13 | RF-05 | Alertas de vencimiento de contratos (job diario, 30 días de anticipación) | Media |
| 14 | RF-11 | Repositorio de documentos (subida/descarga vía Cloud Storage) | Media |

**Decisión de equipo:** durante el Sprint 1 (RF-03 a RF-08) se usa un **usuario administrador de prueba hardcodeado** (sin login real) para no bloquear el desarrollo del flujo de negocio mientras se espera el módulo de autenticación. RF-01 (autenticación real) se implementa en el Sprint 2 y reemplaza ese acceso de prueba.

---

## 7. Requerimientos No Funcionales (10)

| ID | Nombre | Detalle |
|----|--------|---------|
| RNF-01 | Usabilidad | Operable sin capacitación técnica; tareas principales en ≤ 5 pasos |
| RNF-02 | Disponibilidad | 99% en horario laboral |
| RNF-03 | Seguridad | bcrypt para contraseñas, HTTPS obligatorio, JWT ≤ 8h de vida |
| RNF-04 | Rendimiento | Respuesta < 3s con 10 usuarios concurrentes |
| RNF-05 | Escalabilidad | Permitir nuevos módulos sin rediseñar BD ni backend |
| RNF-06 | Compatibilidad | Chrome, Firefox, Edge (últimas 2 versiones anuales) |
| RNF-07 | Mantenibilidad | ESLint + JSDoc + estructura modular por dominio |
| RNF-08 | Portabilidad | Despliegue vía variables de entorno, sin código hardcodeado a un proveedor |
| RNF-09 | Privacidad de datos | Cumplir Ley N° 19.628 |
| RNF-10 | Normativa laboral | Cálculos ajustados al Código del Trabajo chileno vigente |

**Estándar de calidad de referencia:** ISO/IEC 25010:2011 (adecuación funcional, eficiencia, usabilidad, fiabilidad, seguridad, mantenibilidad, portabilidad).

---

## 8. Planificación de Sprints (Scrum, gestionado en Jira — proyecto `SCRUM`)

| Sprint | Fechas | RF incluidos | Estado |
|--------|--------|----------------|--------|
| **Sprint 1** | 08–13 sep 2026 | RF-03, RF-04, RF-06, RF-07, RF-08 | 🔵 En curso (SCRUM-5 a SCRUM-9) |
| Sprint 2 | 14 sep – 04 oct 2026 | RF-09, RF-10, RF-12, RF-13, RF-01 | Por hacer |
| Sprint 3 | 05–18 oct 2026 | RF-02, RF-14 | Por hacer |
| Sprint 4 | 19 oct – 01 nov 2026 | RF-05, RF-11 | Por hacer |

Fechas sujetas a cambios. El tracking oficial vive en Jira (proyecto **SCRUM**, historias SCRUM-5 a SCRUM-18); este documento es el contexto técnico para el agente de desarrollo, no reemplaza al backlog de Jira.

---

## 9. Foco Inmediato: Sprint 1 (lo que hay que construir ahora)

Construir, en este orden, con el patrón de integración full-stack (React ⇄ Express ⇄ PostgreSQL) que se reutilizará en todos los sprints siguientes:

1. **Setup del proyecto**
   - Monorepo o dos carpetas (`/backend`, `/frontend`) — a definir con el agente.
   - Backend: Node.js + Express, conexión a PostgreSQL (usar `pg` o un ORM ligero como Prisma/Sequelize — decidir y documentar la elección).
   - Frontend: React (Vite recomendado sobre CRA), Axios, React Router.
   - Usuario administrador de prueba hardcodeado (sin JWT todavía) para poder probar los endpoints desde el frontend.

2. **RF-03 — Registro de empleados**
   - Tabla `empleados` (ver esquema arriba).
   - Endpoints: `GET/POST/PUT /api/empleados`, `PUT /api/empleados/:id/desactivar`.
   - Validación de RUT único (rechazar duplicados con mensaje claro).
   - Formulario React con validación de campos obligatorios.

3. **RF-04 — Gestión de contratos**
   - Tabla `contratos`, relación con `empleados`.
   - Endpoints CRUD + endpoint de renovación (cierra contrato anterior, crea uno nuevo).
   - Validar que `fecha_termino > fecha_inicio` cuando el tipo es `plazo_fijo`.

4. **RF-06 — Registro de asistencia**
   - Tabla `asistencia`.
   - Endpoint de marcaje (entrada/salida) y de registro de ausencia con justificación.
   - Un registro único por empleado/fecha (constraint `UNIQUE`).

5. **RF-07 — Cálculo de horas trabajadas**
   - Función pura (testeable con Jest) que reciba `hora_entrada`/`hora_salida` y calcule horas trabajadas.
   - Lógica semanal para detectar sobrejornada (> 45 h/semana, valor configurable).

6. **RF-08 — Cálculo de horas extra**
   - Función pura que reciba las horas de sobrejornada y aplique el recargo del 50% (Art. 32) sobre el valor hora.
   - **Debe tener pruebas unitarias con casos reales** (ver sección 12).

**Criterio de "hecho" para el Sprint 1:** un administrador de prueba puede, desde el frontend, crear un empleado, asignarle un contrato, registrar su asistencia varios días, y ver el cálculo automático de horas trabajadas y horas extra reflejado en la base de datos — todo con pruebas unitarias pasando en el backend.

---

## 10. Estructura de Carpetas Sugerida

```
/backend
  /src
    /config          # conexión a BD, variables de entorno
    /models          # definiciones de tablas / ORM
    /routes          # rutas Express por módulo (empleados, contratos, asistencia, ...)
    /controllers     # lógica de cada endpoint
    /services        # lógica de negocio pura (cálculo horas, liquidaciones) — testeable sin BD
    /middleware      # auth, manejo de errores
    /utils
  /tests             # Jest + Supertest
  package.json

/frontend
  /src
    /pages           # una por módulo: Empleados, Contratos, Asistencia, Liquidaciones...
    /components       # reutilizables (tablas, formularios, botones)
    /services        # llamadas Axios a la API
    /context         # auth/rol (aunque en Sprint 1 sea un mock)
    /routes          # React Router
  package.json

PROJECT.md           # este archivo
README.md
.env.example
```

---

## 11. Convenciones de Código

- **Idioma:** nombres de tablas, columnas y endpoints en español (consistente con el dominio del negocio chileno: `empleados`, `contratos`, `liquidaciones`). Nombres de variables/funciones internas en inglés o español, pero **consistentes** dentro del mismo módulo.
- **Linting:** ESLint con reglas estándar de JavaScript; Prettier para formateo.
- **Documentación:** comentarios JSDoc en funciones de `/services` (lógica de negocio) como mínimo.
- **Commits:** convencionales, en español o inglés pero consistente (`feat: agregar endpoint de registro de empleados`).
- **Ramas (Git Flow):** `feature/rf-03-registro-empleados`, luego merge a `develop`, y `develop → main` al cerrar cada sprint.

---

## 12. Casos de Prueba de Referencia (para las pruebas unitarias)

| ID | Qué probar | Entrada | Resultado esperado |
|----|------------|---------|----------------------|
| CP-03 | Registro de empleado con RUT duplicado | RUT ya existente en BD | Rechazar con "Empleado ya registrado" |
| CP-05 | Cálculo de horas extra | 50 horas trabajadas en la semana (jornada 45h) | 5 horas extra, recargo 50% |
| CP-06 | Cálculo de liquidación | Sueldo base $500.000, sin horas extra | Haberes, descuentos AFP (10%)/salud (7%) y líquido a pagar correctos |
| CP-11 | Registro de asistencia con horas inválidas | Hora salida < hora entrada | Rechazar con error de validación |
| CP-15 | Tiempo de respuesta | 10 usuarios concurrentes solicitando liquidación | Respuesta < 3 segundos |

---

## 13. Qué NO hacer en esta etapa (fuera de alcance)

- No implementar módulo CRM ni relación con clientes.
- No implementar evaluación de desempeño.
- No construir dashboards analíticos avanzados/KPIs (solo reportes básicos de asistencia y liquidaciones ya contemplados en RF-12/RF-13).
- No crear app móvil nativa.
- No implementar el perfil "Empleado" con autoservicio (solo Administrador y Gerente en esta versión).

---

## 14. Instrucciones para el agente (Devin / Claude Code)

1. Lee este documento completo antes de escribir código.
2. Empieza por el setup (sección 9, punto 1) y valida que backend y frontend se comunican correctamente antes de avanzar.
3. Sigue el orden de RF de la sección 9 — no adelantes RF-09 (liquidaciones) sin tener RF-07 y RF-08 completos y probados, ya que depende de ambos.
4. Toda función de cálculo de negocio (horas, liquidaciones) debe vivir en `/services`, ser una función pura cuando sea posible, y tener su prueba Jest correspondiente antes de darse por completada.
5. Si una regla legal (gratificación, cotizaciones) no está 100% clara en este documento, decláralo como constante configurable y deja un comentario `// TODO: validar valor legal vigente` en vez de inventar un número definitivo.
6. Al completar cada RF, deja el endpoint documentado (mínimo: método, ruta, body esperado, respuesta) en el README del backend.
7. No agregues dependencias fuera del stack definido en la sección 2 sin justificarlo explícitamente en un comentario o commit.
