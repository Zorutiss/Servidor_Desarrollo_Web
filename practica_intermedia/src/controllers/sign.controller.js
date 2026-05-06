import cloudinary from '../config/cloudinary.js';
import DeliveryNote from '../models/DeliveryNote.js';
import { AppError } from '../utils/AppError.js';
import { generateDeliveryNotePDF } from '../services/pdf.service.js';
import { getIO } from '../socket/index.js';

const populate = [
  { path: 'client', select: 'name cif email' },
  { path: 'project', select: 'name projectCode' },
  { path: 'user', select: 'name lastName email' },
];

// PATCH /api/deliverynote/:id/sign
export const signDeliveryNote = async (req, res, next) => {
  try {
    const companyId = req.user.company?._id || req.user.company;

    const note = await DeliveryNote.findOne({
      _id: req.params.id,
      company: companyId,
      deleted: false,
    });

    if (!note) return next(AppError.notFound('Albarán no encontrado'));
    if (note.signed) return next(AppError.badRequest('El albarán ya está firmado'));
    if (!req.file) return next(AppError.badRequest('No se ha subido ninguna imagen de firma'));

    // SUBIR FIRMA A CLOUDINARY
    const signatureUrl = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'bildyapp/signatures', public_id: `firma_${note._id}`, resource_type: 'image' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result.secure_url);
        }
      );
      stream.end(req.file.buffer);
    });

    note.signed = true;
    note.signedAt = new Date();
    note.signatureUrl = signatureUrl;
    await note.save();

    const populated = await note.populate(populate);
    const pdfUrl = await generateDeliveryNotePDF(populated);

    note.pdfUrl = pdfUrl;
    await note.save();

    // NOTIFICAR A TODOS LOS USUARIOS DE LA COMPAÑIA
    try { getIO().to(companyId.toString()).emit('deliverynote:signed', { deliveryNoteId: note._id, pdfUrl }); } catch {}

    res.json({
      message: 'Albarán firmado correctamente',
      deliveryNote: {
        _id: note._id,
        signed: note.signed,
        signedAt: note.signedAt,
        signatureUrl: note.signatureUrl,
        pdfUrl: note.pdfUrl,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/deliverynote/:id/pdf 
export const getDeliveryNotePDF = async (req, res, next) => {
  try {
    const companyId = req.user.company?._id || req.user.company;

    const note = await DeliveryNote.findOne({
      _id: req.params.id,
      company: companyId,
      deleted: false,
    }).populate(populate);

    if (!note) return next(AppError.notFound('Albarán no encontrado'));

    if (note.pdfUrl) {
      return res.json({ pdfUrl: note.pdfUrl });
    }

    const pdfUrl = await generateDeliveryNotePDF(note);
    note.pdfUrl = pdfUrl;
    await note.save();

    res.json({ pdfUrl });
  } catch (err) {
    next(err);
  }
};
