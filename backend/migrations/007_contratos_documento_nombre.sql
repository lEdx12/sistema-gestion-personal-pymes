-- Guarda el nombre original del archivo subido como documento del contrato, ya que el
-- archivo en disco se renombra (uploadContrato.js) y antes no quedaba registro de cómo
-- se llamaba para mostrarlo en la UI (solo quedaba el enlace genérico "Ver documento").
ALTER TABLE contratos ADD COLUMN documento_nombre VARCHAR(255);
