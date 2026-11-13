-- RF-06/RF-07: horario de la jornada diaria configurable por el Administrador, usado
-- para calcular la sobrejornada (horas extra) de cada registro de asistencia en vez
-- del valor fijo JORNADA_DIARIA_MAX_HORAS por variable de entorno.
ALTER TABLE configuracion_sueldo
  ADD COLUMN jornada_hora_inicio TIME NOT NULL DEFAULT '09:00',
  ADD COLUMN jornada_hora_fin TIME NOT NULL DEFAULT '17:00';
