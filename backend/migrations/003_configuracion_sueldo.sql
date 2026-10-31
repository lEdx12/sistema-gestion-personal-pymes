-- RF-16: porcentajes y montos del cálculo de liquidaciones, configurables por el
-- Administrador en vez de fijos en variables de entorno/código. Fila única (id=1).
CREATE TABLE configuracion_sueldo (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  afp_porcentaje DECIMAL(6,4) NOT NULL DEFAULT 0.10,
  salud_porcentaje DECIMAL(6,4) NOT NULL DEFAULT 0.07,
  afc_indefinido_porcentaje DECIMAL(6,4) NOT NULL DEFAULT 0.006,
  afc_plazo_fijo_porcentaje DECIMAL(6,4) NOT NULL DEFAULT 0,
  gratificacion_porcentaje DECIMAL(6,4) NOT NULL DEFAULT 0.25,
  gratificacion_tope_mensual DECIMAL(12,2) NOT NULL DEFAULT 240000,
  movilizacion_monto DECIMAL(12,2) NOT NULL DEFAULT 0,
  colacion_monto DECIMAL(12,2) NOT NULL DEFAULT 0,
  valor_utm DECIMAL(12,2) NOT NULL DEFAULT 68000,
  updated_at TIMESTAMP DEFAULT NOW(),
  updated_by INT REFERENCES usuarios(id)
);

INSERT INTO configuracion_sueldo (id) VALUES (1);
