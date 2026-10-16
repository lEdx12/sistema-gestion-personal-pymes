const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'liquidaciones');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

function formatearMonto(valor) {
  return Number(valor).toLocaleString('es-CL');
}

function nombreArchivo(liquidacion) {
  return `liquidacion-${liquidacion.periodo}-${liquidacion.id}.pdf`;
}

function rutaArchivo(liquidacion) {
  return path.join(UPLOAD_DIR, nombreArchivo(liquidacion));
}

/** Genera el PDF de una liquidación en disco y resuelve con su ruta absoluta. */
function generarPdfLiquidacion(liquidacion, empleado) {
  const ruta = rutaArchivo(liquidacion);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(ruta);
    doc.pipe(stream);

    doc.fontSize(16).text('Liquidación de Sueldo', { align: 'center' });
    doc.moveDown();

    doc.fontSize(10);
    doc.text(`Período: ${liquidacion.periodo}`);
    doc.text(`Empleado: ${empleado.nombre} ${empleado.apellido}`);
    doc.text(`RUT: ${empleado.rut}`);
    doc.text(`Cargo: ${empleado.cargo || '-'}`);
    doc.moveDown();

    doc.fontSize(12).text('Haberes', { underline: true });
    doc.fontSize(10);
    doc.text(`Sueldo base: $${formatearMonto(liquidacion.sueldo_base)}`);
    doc.text(`Horas extra: $${formatearMonto(liquidacion.horas_extra_monto)}`);
    doc.text(`Gratificación: $${formatearMonto(liquidacion.gratificacion)}`);
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text(`Total haberes: $${formatearMonto(liquidacion.total_haberes)}`);
    doc.font('Helvetica');
    doc.moveDown();

    doc.fontSize(12).text('Descuentos', { underline: true });
    doc.fontSize(10);
    doc.text(`AFP: $${formatearMonto(liquidacion.descuento_afp)}`);
    doc.text(`Salud: $${formatearMonto(liquidacion.descuento_salud)}`);
    doc.text(`Seguro de cesantía: $${formatearMonto(liquidacion.descuento_cesantia)}`);
    if (Number(liquidacion.otros_descuentos) > 0) {
      doc.text(`Otros descuentos: $${formatearMonto(liquidacion.otros_descuentos)}`);
    }
    doc.moveDown(0.5);
    doc.font('Helvetica-Bold').text(`Total descuentos: $${formatearMonto(liquidacion.total_descuentos)}`);
    doc.font('Helvetica');
    doc.moveDown();

    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text(`Líquido a pagar: $${formatearMonto(liquidacion.liquido_pagar)}`, { align: 'right' });

    doc.end();
    stream.on('finish', () => resolve(ruta));
    stream.on('error', reject);
  });
}

module.exports = { generarPdfLiquidacion, rutaArchivo, nombreArchivo };
