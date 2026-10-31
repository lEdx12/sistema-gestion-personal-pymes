const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { convertirMontoATexto } = require('../utils/numeroALetras');
const { diasDelPeriodo } = require('../utils/periodo');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'liquidaciones');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const MESES = [
  'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
  'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE',
];

function formatearMonto(valor) {
  return Number(valor).toLocaleString('es-CL');
}

/** Redondea a 2 decimales y quita ceros sobrantes (evita artefactos de punto flotante, ej. 0.07*100). */
function formatearPorcentaje(valor) {
  return (Math.round(valor * 100) / 100).toString();
}

/** Acepta un Date (como lo devuelve `pg` para columnas DATE) o un string "YYYY-MM-DD". */
function formatearFechaCorta(fecha) {
  if (!fecha) return '';
  const [anio, mes, dia] = new Date(fecha).toISOString().slice(0, 10).split('-');
  return `${dia}/${mes}/${anio}`;
}

function nombreMesPeriodo(periodo) {
  const [anio, mes] = periodo.split('-').map(Number);
  return `${MESES[mes - 1]} del ${anio}`;
}

/**
 * Datos de la empresa y de las instituciones previsionales que aparecen impresas en
 * la liquidación. No se modelan como tablas (el sistema es de una sola PyME, sección 1
 * de PROJECT.md, y no se registra a qué AFP/Isapre está afiliado cada trabajador) —
 * son texto configurable vía `.env`, igual que los porcentajes de cotización.
 */
function datosEmpresa() {
  return {
    razonSocial: process.env.EMPRESA_RAZON_SOCIAL || 'Mi Empresa SpA.',
    rut: process.env.EMPRESA_RUT || '76.000.000-0',
    afpNombre: process.env.AFP_NOMBRE || 'AFP',
    saludNombre: process.env.SALUD_NOMBRE || 'FONASA',
  };
}

function nombreArchivo(liquidacion) {
  return `liquidacion-${liquidacion.periodo}-${liquidacion.id}.pdf`;
}

function rutaArchivo(liquidacion) {
  return path.join(UPLOAD_DIR, nombreArchivo(liquidacion));
}

const MARGEN = 50;

/**
 * Genera el PDF de una liquidación en disco y resuelve con su ruta absoluta.
 * El formato sigue la estructura clásica de una liquidación de sueldo chilena
 * (encabezado de datos del trabajador, resumen de días/imponible, dos columnas de
 * haberes/descuentos, totales y monto en palabras) a pedido explícito del cliente,
 * en vez del resumen vertical simple usado hasta RF-10.
 */
function generarPdfLiquidacion(liquidacion, empleado, contrato) {
  const ruta = rutaArchivo(liquidacion);
  const empresa = datosEmpresa();

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: MARGEN, size: 'LETTER' });
    const stream = fs.createWriteStream(ruta);
    doc.pipe(stream);

    const anchoContenido = doc.page.width - MARGEN * 2;
    const colIzqX = MARGEN;
    const colDerX = MARGEN + anchoContenido / 2 + 10;
    const anchoCol = anchoContenido / 2 - 10;

    doc.font('Courier');
    let y = MARGEN;

    doc
      .font('Courier-Bold')
      .fontSize(14)
      .text('LIQUIDACION DE SUELDO', MARGEN, y, { width: anchoContenido, align: 'center' });
    y += 26;

    doc
      .font('Courier-Bold')
      .fontSize(9)
      .text(`REMUNERACIONES MES DE: ${nombreMesPeriodo(liquidacion.periodo)}`, MARGEN, y);
    y += 20;

    /** Dibuja una etiqueta en negrita con su valor debajo, dentro de una columna. */
    function campo(x, label, valor) {
      doc.font('Courier-Bold').fontSize(8).text(label, x, y, { width: anchoCol });
      doc.font('Courier').fontSize(9.5).text(valor || '', x, y + 11, { width: anchoCol });
    }

    function filaDoble(labelIzq, valorIzq, labelDer, valorDer) {
      campo(colIzqX, labelIzq, valorIzq);
      if (labelDer) campo(colDerX, labelDer, valorDer);
      y += 28;
    }

    filaDoble('RAZON SOCIAL:', empresa.razonSocial, 'RUT EMPRESA:', empresa.rut);
    filaDoble(
      'R.U.T. TRABAJADOR',
      empleado.rut,
      'TRABAJADOR',
      `${empleado.nombre} ${empleado.apellido}`.toUpperCase(),
    );
    filaDoble(
      'FECHA INGRESO',
      formatearFechaCorta(empleado.fecha_ingreso),
      'TIPO DE CONTRATO',
      contrato ? contrato.tipo.replace('_', ' ').toUpperCase() : '',
    );
    filaDoble(
      'CARGO FUNCIONARIO',
      (empleado.cargo || '').toUpperCase(),
      'FECHA TERMINO CONTRATO',
      contrato ? formatearFechaCorta(contrato.fecha_termino) : '',
    );
    // El % mostrado se calcula a partir de los montos ya guardados en la liquidación
    // (no de la configuración actual, que puede haber cambiado desde que se generó).
    const baseImponible =
      Number(liquidacion.sueldo_base) + Number(liquidacion.horas_extra_monto) + Number(liquidacion.gratificacion);
    const afpPorcentaje =
      baseImponible > 0 ? formatearPorcentaje((Number(liquidacion.descuento_afp) / baseImponible) * 100) : '0';
    const saludPorcentaje =
      baseImponible > 0 ? formatearPorcentaje((Number(liquidacion.descuento_salud) / baseImponible) * 100) : '0';
    filaDoble(
      'A.F.P.',
      `${empresa.afpNombre}  ${afpPorcentaje}%`,
      'SALUD',
      `${empresa.saludNombre}  ${saludPorcentaje}%`,
    );

    y += 4;
    doc.moveTo(MARGEN, y).lineTo(MARGEN + anchoContenido, y).lineWidth(0.5).stroke();
    y += 10;

    filaDoble('DIAS', String(diasDelPeriodo(liquidacion.periodo)), 'TOTAL IMPONIBLE', `$${formatearMonto(baseImponible)}`);

    doc.moveTo(MARGEN, y).lineTo(MARGEN + anchoContenido, y).lineWidth(0.5).stroke();
    y += 14;

    doc.font('Courier-Bold').fontSize(9.5);
    doc.text('HABERES', colIzqX, y, { width: anchoCol, align: 'center' });
    doc.text('DESCUENTOS', colDerX, y, { width: anchoCol, align: 'center' });
    y += 16;

    /** Lista de [etiqueta, monto] en una columna, monto alineado a la derecha. */
    function listaMontos(x, filas) {
      let yLista = y;
      doc.font('Courier').fontSize(9);
      for (const [etiqueta, monto, negrita] of filas) {
        doc.font(negrita ? 'Courier-Bold' : 'Courier');
        doc.text(etiqueta, x, yLista, { width: anchoCol - 80 });
        doc.text(`$${formatearMonto(monto)}`, x + anchoCol - 80, yLista, { width: 80, align: 'right' });
        yLista += 13;
      }
      return yLista;
    }

    const filasHaberes = [['SUELDO BASE', liquidacion.sueldo_base]];
    if (Number(liquidacion.horas_extra_monto) > 0) {
      filasHaberes.push(['HORAS EXTRA', liquidacion.horas_extra_monto]);
    }
    filasHaberes.push(['GRATIFICACION LEGAL', liquidacion.gratificacion]);
    if (Number(liquidacion.movilizacion) > 0) {
      filasHaberes.push(['MOVILIZACION', liquidacion.movilizacion]);
    }
    if (Number(liquidacion.colacion) > 0) {
      filasHaberes.push(['COLACION', liquidacion.colacion]);
    }
    filasHaberes.push(['TOTAL HABERES', liquidacion.total_haberes, true]);

    const filasDescuentos = [
      [`${empresa.afpNombre} (PREVISION)`, liquidacion.descuento_afp],
      [empresa.saludNombre, liquidacion.descuento_salud],
      ['SEGURO CESANTIA', liquidacion.descuento_cesantia],
    ];
    if (Number(liquidacion.descuento_impuesto) > 0) {
      filasDescuentos.push(['IMPUESTO UNICO', liquidacion.descuento_impuesto]);
    }
    if (Number(liquidacion.otros_descuentos) > 0) {
      filasDescuentos.push(['OTROS DESCUENTOS', liquidacion.otros_descuentos]);
    }
    filasDescuentos.push(['TOTAL DESCUENTOS', liquidacion.total_descuentos, true]);

    const yFinHaberes = listaMontos(colIzqX, filasHaberes);
    const yFinDescuentos = listaMontos(colDerX, filasDescuentos);
    y = Math.max(yFinHaberes, yFinDescuentos) + 6;

    doc.moveTo(MARGEN, y).lineTo(MARGEN + anchoContenido, y).lineWidth(0.8).stroke();
    y += 14;

    doc.font('Courier-Bold').fontSize(10);
    doc.text('FECHA:', colIzqX, y);
    doc.font('Courier').text(formatearFechaCorta(new Date()), colIzqX + 60, y);
    doc.font('Courier-Bold').text('ALCANCE LIQUIDO:', colDerX, y);
    doc
      .font('Courier-Bold')
      .text(`$${formatearMonto(liquidacion.liquido_pagar)}`, colDerX, y, { width: anchoCol, align: 'right' });
    y += 24;

    doc.font('Courier-Bold').fontSize(9).text('SON:', MARGEN, y, { continued: true });
    doc.font('Courier').text(` ${convertirMontoATexto(liquidacion.liquido_pagar)}.`, { width: anchoContenido - 30 });
    y = doc.y + 40;

    const anchoFirma = anchoCol - 20;
    doc.moveTo(colIzqX, y).lineTo(colIzqX + anchoFirma, y).lineWidth(0.5).stroke();
    doc.moveTo(colDerX, y).lineTo(colDerX + anchoFirma, y).lineWidth(0.5).stroke();
    y += 6;
    doc.font('Courier').fontSize(8);
    doc.text('FIRMA DEL EMPLEADOR', colIzqX, y, { width: anchoFirma, align: 'center' });
    doc.text('FIRMA DEL TRABAJADOR', colDerX, y, { width: anchoFirma, align: 'center' });

    doc.end();
    stream.on('finish', () => resolve(ruta));
    stream.on('error', reject);
  });
}

module.exports = { generarPdfLiquidacion, rutaArchivo, nombreArchivo };
