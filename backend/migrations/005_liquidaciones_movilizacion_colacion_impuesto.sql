-- RF-16/RF-17: la liquidación ahora guarda la movilización y colación (haberes no
-- imponibles, montos fijos configurables) y el descuento de impuesto único aplicado,
-- además de los campos existentes.
ALTER TABLE liquidaciones
  ADD COLUMN movilizacion DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN colacion DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN descuento_impuesto DECIMAL(12,2) NOT NULL DEFAULT 0;
