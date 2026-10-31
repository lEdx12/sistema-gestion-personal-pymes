const alertaModel = require('../models/alerta.model');
const { envNumber } = require('../utils/env');
const { paginar } = require('../utils/paginacion');

class ServiceError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const TIPO_VENCIMIENTO = 'vencimiento_contrato';

function diasAnticipacion() {
  // RF-05: 30 días de anticipación por defecto — configurable, no hardcodeado.
  return envNumber('ALERTA_DIAS_ANTICIPACION', 30);
}

function formatearFecha(fecha) {
  return new Date(fecha).toISOString().slice(0, 10);
}

function construirMensaje(contrato) {
  return `El contrato de ${contrato.empleado_nombre} ${contrato.empleado_apellido} (RUT ${contrato.empleado_rut}) vence el ${formatearFecha(contrato.fecha_termino)}.`;
}

/**
 * RF-05: busca contratos a plazo fijo que vencen dentro de la ventana de anticipación
 * y crea una alerta por cada uno que todavía no tenga una (para no duplicar si el job
 * corre varias veces). Pensado para ejecutarse una vez al día (ver src/jobs).
 */
async function generarAlertasVencimiento() {
  const contratos = await alertaModel.findContratosPorVencer(diasAnticipacion());
  const generadas = [];

  for (const contrato of contratos) {
    const yaExiste = await alertaModel.existePorContrato(contrato.contrato_id, TIPO_VENCIMIENTO);
    if (yaExiste) continue;

    const alerta = await alertaModel.create({
      empleado_id: contrato.empleado_id,
      contrato_id: contrato.contrato_id,
      tipo: TIPO_VENCIMIENTO,
      mensaje: construirMensaje(contrato),
      fecha_alerta: formatearFecha(new Date()),
    });
    generadas.push(alerta);
  }

  return generadas;
}

async function listarAlertas({ soloNoLeidas, tipo, pagina, porPagina } = {}) {
  const alertas = await alertaModel.findAll({ soloNoLeidas, tipo });
  return paginar(alertas, { pagina, porPagina });
}

async function marcarAlertaLeida(id) {
  const alerta = await alertaModel.findById(id);
  if (!alerta) throw new ServiceError(404, 'Alerta no encontrada');
  return alertaModel.marcarLeida(id);
}

module.exports = {
  ServiceError,
  TIPO_VENCIMIENTO,
  generarAlertasVencimiento,
  listarAlertas,
  marcarAlertaLeida,
};
