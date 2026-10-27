const PDFDocument = require('pdfkit');

/** `fecha` llega como Date (pg) cuando el controlador llama al servicio directo en Node. */
function formatearFecha(fecha) {
  if (!fecha) return '';
  return new Date(fecha).toISOString().slice(0, 10);
}

/**
 * Dibuja una tabla simple (encabezado en negrita + filas), repitiendo el encabezado si
 * el contenido no cabe en una página. `columnas` es [{ titulo, ancho }].
 */
function dibujarTabla(doc, { columnas, filas }) {
  const xInicial = doc.page.margins.left;
  const anchoTotal = columnas.reduce((acc, c) => acc + c.ancho, 0);
  const alturaFila = 18;

  // Captura `y` una sola vez por fila: doc.text() con (x, y) explícitos igual mueve el
  // cursor interno de pdfkit, así que reusar doc.y entre columnas desalinearía la fila.
  function dibujarFila(valores, negrita) {
    const y = doc.y;
    doc.font(negrita ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);
    let x = xInicial;
    for (let i = 0; i < valores.length; i++) {
      doc.text(String(valores[i] ?? ''), x, y, { width: columnas[i].ancho });
      x += columnas[i].ancho;
    }
    doc.y = y + alturaFila;
  }

  function encabezado() {
    dibujarFila(columnas.map((c) => c.titulo), true);
    const yLinea = doc.y - 4;
    doc.moveTo(xInicial, yLinea).lineTo(xInicial + anchoTotal, yLinea).lineWidth(0.5).stroke();
  }

  encabezado();
  for (const fila of filas) {
    if (doc.y > doc.page.height - doc.page.margins.bottom - alturaFila) {
      doc.addPage();
      encabezado();
    }
    dibujarFila(fila, false);
  }
}

/**
 * Genera el PDF de un reporte de asistencia mensual (RF-12), individual o
 * consolidado. A diferencia de las liquidaciones, el reporte no es un documento
 * inmutable (se recalcula de la asistencia vigente), así que no se persiste en disco:
 * se arma al vuelo y el controlador lo transmite directo a la respuesta HTTP.
 */
function generarPdfReporteMensual(reporte) {
  const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
  const anchoContenido = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  doc.font('Helvetica-Bold').fontSize(16).text('Reporte de Asistencia Mensual', { align: 'center' });
  doc.moveDown(1);
  doc.font('Helvetica').fontSize(10);

  if (reporte.empleado) {
    doc.text(`Empleado: ${reporte.empleado.nombre} ${reporte.empleado.apellido} (${reporte.empleado.rut})`);
    doc.text(`Período: ${reporte.periodo}`);
    doc.moveDown(0.3);
    doc
      .font('Helvetica-Bold')
      .text(
        `Días trabajados: ${reporte.diasTrabajados}    Ausencias: ${reporte.diasAusentes}    ` +
          `Horas totales: ${reporte.totalHoras}    Sobrejornada: ${reporte.horasSobrejornada} h`,
      );
    doc.moveDown(1);

    dibujarTabla(doc, {
      columnas: [
        { titulo: 'Fecha', ancho: 65 },
        { titulo: 'Entrada', ancho: 55 },
        { titulo: 'Salida', ancho: 55 },
        { titulo: 'Horas', ancho: 45 },
        { titulo: 'Ausente', ancho: 50 },
        { titulo: 'Justificación', ancho: anchoContenido - 65 - 55 - 55 - 45 - 50 },
      ],
      filas: reporte.registros.map((r) => [
        formatearFecha(r.fecha),
        r.ausente ? '—' : (r.hora_entrada || '—').slice(0, 5),
        r.ausente ? '—' : (r.hora_salida || '—').slice(0, 5),
        r.horas_trabajadas ?? '—',
        r.ausente ? 'Sí' : 'No',
        r.justificacion || '',
      ]),
    });
  } else {
    doc.text(`Período: ${reporte.periodo} — Consolidado (${reporte.empleados.length} empleado(s) activo(s))`);
    doc.moveDown(1);

    dibujarTabla(doc, {
      columnas: [
        { titulo: 'RUT', ancho: 75 },
        { titulo: 'Nombre', ancho: 160 },
        { titulo: 'Días trab.', ancho: 65 },
        { titulo: 'Ausencias', ancho: 65 },
        { titulo: 'Horas tot.', ancho: 65 },
        { titulo: 'Sobrejornada', ancho: anchoContenido - 75 - 160 - 65 - 65 - 65 },
      ],
      filas: reporte.empleados.map((e) => [
        e.rut,
        `${e.nombre} ${e.apellido}`,
        e.diasTrabajados,
        e.diasAusentes,
        e.totalHoras,
        e.horasSobrejornada,
      ]),
    });
  }

  doc.end();
  return doc;
}

module.exports = { generarPdfReporteMensual };
