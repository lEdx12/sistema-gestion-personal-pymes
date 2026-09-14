-- Migración inicial: esquema base del Sistema de Gestión de Personal para PyMES
-- Ver PROJECT.md sección 4 para el contexto de cada tabla.

CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(20) NOT NULL CHECK (rol IN ('administrador', 'gerente')),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

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

CREATE TABLE contratos (
  id SERIAL PRIMARY KEY,
  empleado_id INT NOT NULL REFERENCES empleados(id),
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('indefinido', 'plazo_fijo')),
  fecha_inicio DATE NOT NULL,
  fecha_termino DATE,
  documento_url VARCHAR(255),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

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

CREATE TABLE liquidaciones (
  id SERIAL PRIMARY KEY,
  empleado_id INT NOT NULL REFERENCES empleados(id),
  generado_por INT REFERENCES usuarios(id),
  periodo VARCHAR(7) NOT NULL,
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

CREATE TABLE documentos (
  id SERIAL PRIMARY KEY,
  empleado_id INT NOT NULL REFERENCES empleados(id),
  nombre VARCHAR(150),
  tipo VARCHAR(50),
  url VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
