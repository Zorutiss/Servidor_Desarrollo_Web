import PDFDocument from 'pdfkit';
import cloudinary from '../config/cloudinary.js';

export const generateDeliveryNotePDF = async (note) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('error', reject);
    doc.on('end', async () => {
      try {
        const buffer = Buffer.concat(chunks);

        // SUBIR A CLOUDINARY PDF
        const result = await new Promise((res, rej) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: 'bildyapp/pdfs',
              resource_type: 'raw',
              public_id: `albaran_${note._id}`,
              format: 'pdf',
            },
            (error, result) => {
              if (error) rej(error);
              else res(result);
            }
          );
          stream.end(buffer);
        });

        resolve(result.secure_url);
      } catch (err) {
        reject(err);
      }
    });

    // Cabecera 
    doc.fontSize(20).font('Helvetica-Bold').text('ALBARÁN', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor('#666')
      .text(`Nº: ${note._id}`, { align: 'center' });
    doc.moveDown(1);

    // Línea separadora 
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cccccc').stroke();
    doc.moveDown(1);

    // Datos empresa / usuario 
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#000').text('EMISOR');
    doc.fontSize(10).font('Helvetica');
    const userName = note.user?.name
      ? `${note.user.name} ${note.user.lastName || ''}`.trim()
      : 'N/A';
    doc.text(`Nombre: ${userName}`);
    doc.text(`Email: ${note.user?.email || 'N/A'}`);
    doc.moveDown(1);

    // Datos cliente
    doc.fontSize(12).font('Helvetica-Bold').text('CLIENTE');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Nombre: ${note.client?.name || 'N/A'}`);
    doc.text(`CIF: ${note.client?.cif || 'N/A'}`);
    doc.moveDown(1);

    // Datos proyecto 
    doc.fontSize(12).font('Helvetica-Bold').text('PROYECTO');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Nombre: ${note.project?.name || 'N/A'}`);
    doc.text(`Código: ${note.project?.projectCode || 'N/A'}`);
    doc.moveDown(1);

    // Detalles del albarán 
    doc.fontSize(12).font('Helvetica-Bold').text('DETALLES');
    doc.fontSize(10).font('Helvetica');
    doc.text(`Formato: ${note.format === 'hours' ? 'Horas' : 'Material'}`);
    doc.text(`Fecha de trabajo: ${new Date(note.workDate).toLocaleDateString('es-ES')}`);
    if (note.description) doc.text(`Descripción: ${note.description}`);
    doc.moveDown(0.5);

    if (note.format === 'material') {
      doc.text(`Material: ${note.material}`);
      doc.text(`Cantidad: ${note.quantity} ${note.unit}`);
    } else {
      if (note.hours) doc.text(`Horas totales: ${note.hours}h`);
      if (note.workers?.length) {
        doc.moveDown(0.5);
        doc.fontSize(11).font('Helvetica-Bold').text('Trabajadores:');
        doc.fontSize(10).font('Helvetica');
        note.workers.forEach((w) => {
          doc.text(`  • ${w.name}: ${w.hours}h`);
        });
      }
    }

    doc.moveDown(2);

    // Firma 
    if (note.signatureUrl) {
      doc.fontSize(12).font('Helvetica-Bold').text('FIRMA');
      doc.moveDown(0.5);
      try {
        doc.image(note.signatureUrl, { width: 150 });
      } catch {
        doc.fontSize(10).font('Helvetica').text('Firma digital adjunta');
      }
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica').fillColor('#666')
        .text(`Firmado el: ${new Date(note.signedAt).toLocaleString('es-ES')}`);
    }

    // Pie de página 
    doc.fontSize(8).fillColor('#999')
      .text(
        `Documento generado el ${new Date().toLocaleString('es-ES')}`,
        50,
        doc.page.height - 50,
        { align: 'center' }
      );

    doc.end();
  });
};
