import DeliveryNote from '../models/DeliveryNote.js';
import Client from '../models/Client.js';
import Project from '../models/Project.js';
import { AppError } from '../utils/AppError.js';
import { getIO } from '../socket/index.js';

const populate = [
  { path: 'client', select: 'name cif email' },
  { path: 'project', select: 'name projectCode' },
  { path: 'user', select: 'name lastName email' },
];

// ── POST /api/deliverynote ───────────────────────────────────
export const createDeliveryNote = async (req, res, next) => {
  try {
    const companyId = req.user.company?._id || req.user.company;
    if (!companyId) {
      return next(AppError.badRequest('Debes completar el onboarding de compañía primero'));
    }

    const { client, project } = req.body;

    const clientDoc = await Client.findOne({ _id: client, company: companyId, deleted: false });
    if (!clientDoc) return next(AppError.notFound('Cliente no encontrado en tu compañía'));

    const projectDoc = await Project.findOne({ _id: project, company: companyId, client, deleted: false });
    if (!projectDoc) return next(AppError.notFound('Proyecto no encontrado para ese cliente'));

    const note = await DeliveryNote.create({
      ...req.body,
      user: req.user._id,
      company: companyId,
      workDate: new Date(req.body.workDate),
    });

    const populated = await note.populate(populate);

    // Notificar en tiempo real a todos los usuarios de la compañía
    try { getIO().to(companyId.toString()).emit('deliverynote:new', { deliveryNote: populated }); } catch {}

    res.status(201).json({ deliveryNote: populated });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/deliverynote ────────────────────────────────────
export const getDeliveryNotes = async (req, res, next) => {
  try {
    const companyId = req.user.company?._id || req.user.company;
    const { page = 1, limit = 10, client, project, format, signed, sort = '-createdAt' } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const filter = { company: companyId, deleted: false };

    if (client) filter.client = client;
    if (project) filter.project = project;
    if (format) filter.format = format;
    if (signed !== undefined) filter.signed = signed === 'true';

    const [notes, totalItems] = await Promise.all([
      DeliveryNote.find(filter).populate(populate).sort(sort).skip(skip).limit(parseInt(limit)),
      DeliveryNote.countDocuments(filter),
    ]);

    res.json({
      deliveryNotes: notes,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / parseInt(limit)),
        currentPage: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/deliverynote/:id ────────────────────────────────
export const getDeliveryNoteById = async (req, res, next) => {
  try {
    const companyId = req.user.company?._id || req.user.company;
    const note = await DeliveryNote.findOne({
      _id: req.params.id,
      company: companyId,
      deleted: false,
    }).populate(populate);

    if (!note) return next(AppError.notFound('Albarán no encontrado'));
    res.json({ deliveryNote: note });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/deliverynote/:id ────────────────────────────────
export const updateDeliveryNote = async (req, res, next) => {
  try {
    const companyId = req.user.company?._id || req.user.company;
    const note = await DeliveryNote.findOne({
      _id: req.params.id,
      company: companyId,
      deleted: false,
    });

    if (!note) return next(AppError.notFound('Albarán no encontrado'));
    if (note.signed) return next(AppError.forbidden('No se puede editar un albarán ya firmado'));

    if (req.body.workDate) req.body.workDate = new Date(req.body.workDate);
    Object.assign(note, req.body);
    await note.save();

    const populated = await note.populate(populate);
    res.json({ deliveryNote: populated });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/deliverynote/:id ─────────────────────────────
export const deleteDeliveryNote = async (req, res, next) => {
  try {
    const companyId = req.user.company?._id || req.user.company;
    const note = await DeliveryNote.findOne({
      _id: req.params.id,
      company: companyId,
      deleted: false,
    });

    if (!note) return next(AppError.notFound('Albarán no encontrado'));
    if (note.signed) return next(AppError.forbidden('No se puede eliminar un albarán ya firmado'));

    await note.deleteOne();
    res.json({ message: 'Albarán eliminado correctamente' });
  } catch (err) {
    next(err);
  }
};
