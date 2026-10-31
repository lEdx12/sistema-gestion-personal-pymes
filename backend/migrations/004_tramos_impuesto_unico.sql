-- RF-17: tabla de tramos del Impuesto Único de Segunda Categoría, expresados en UTM
-- (igual que la tabla oficial del SII), editable por el Administrador. "hasta_utm" NULL
-- en el último tramo significa "sin tope". Valores de referencia iniciales — ver nota en
-- backend/README.md: deben verificarse/ajustarse contra la tabla vigente, igual que los
-- demás porcentajes de backend/src/services/liquidacionCalculo.service.js.
CREATE TABLE tramos_impuesto_unico (
  id SERIAL PRIMARY KEY,
  orden SMALLINT NOT NULL UNIQUE,
  desde_utm DECIMAL(10,2) NOT NULL,
  hasta_utm DECIMAL(10,2),
  factor DECIMAL(6,4) NOT NULL,
  rebaja_utm DECIMAL(10,4) NOT NULL DEFAULT 0
);

INSERT INTO tramos_impuesto_unico (orden, desde_utm, hasta_utm, factor, rebaja_utm) VALUES
  (1, 0, 13.5, 0, 0),
  (2, 13.5, 30, 0.04, 0.54),
  (3, 30, 50, 0.08, 1.74),
  (4, 50, 70, 0.135, 4.49),
  (5, 70, 90, 0.23, 11.14),
  (6, 90, 120, 0.304, 17.80),
  (7, 120, 310, 0.355, 23.92),
  (8, 310, NULL, 0.40, 37.57);
