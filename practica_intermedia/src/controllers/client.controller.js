import Client from '../models/Client.js';
import { AppError } from '../utils/AppError.js';
import { getIO } from '../socket/index.js';

// ── POST /api/client ─────────────────────────────────────────
export const createClient = async (req, res, next) => {
  try {
    const { name, cif, email, phone, address } = req.body;
    const companyId = req.user.company?._id || req.user.company;

    if (!companyId) {
      return next(AppError.badRequest('Debes completar el onboarding de compañía primero'));
    }

    const existing = await Client.findOne({ cif, company: companyId, deleted: false });
    if (existing) {
      return next(AppError.conflict('Ya existe un cliente con ese CIF en tu compañía'));
    }

    const client = await Client.create({
      user: req.user._id,
      company: companyId,
      name,
      cif,
      email,
      phone,
      address,
    });

    // Notificar en tiempo real a todos los usuarios de la compañía
    try { getIO().to(companyId.toString()).emit('client:new', { client }); } catch {}

    res.status(201).json({ client });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/client/:id ──────────────────────────────────────
export const updateClient = async (req, res, next) => {
  try {
    const companyId = req.user.company?._id || req.user.company;
    const client = await Client.findOne({
      _id: req.params.id,
      company: companyId,
      deleted: false,
    });

    if (!client) return next(AppError.notFound('Cliente no encontrado'));

    if (req.body.cif && req.body.cif !== client.cif) {
      const existing = await Client.findOne({
        cif: req.body.cif,
        company: companyId,
        deleted: false,
        _id: { $ne: client._id },
      });
      if (existing) return next(AppError.conflict('Ya existe un cliente con ese CIF'));
    }

    Object.assign(client, req.body);
    await client.save();

    res.json({ client });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/client ──────────────────────────────────────────
export const getClients = async (req, res, next) => {
  try {
    const companyId = req.user.company?._id || req.user.company;
    const { page = 1, limit = 10, name, sort = '-createdAt' } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const filter = { company: companyId, deleted: false };
    if (name) filter.name = { $regex: name, $options: 'i' };

    const [clients, totalItems] = await Promise.all([
      Client.find(filter).sort(sort).skip(skip).limit(parseInt(limit)),
      Client.countDocuments(filter),
    ]);

    res.json({
      clients,
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

// ── GET /api/client/archived ─────────────────────────────────
export const getArchivedClients = async (req, res, next) => {
  try {
    const companyId = req.user.company?._id || req.user.company;
    const clients = await Client.find({ company: companyId, deleted: true });
    res.json({ clients });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/client/:id ──────────────────────────────────────
export const getClientById = async (req, res, next) => {
  try {
    const companyId = req.user.company?._id || req.user.company;
    const client = await Client.findOne({
      _id: req.params.id,
      company: companyId,
      deleted: false,
    });

    if (!client) return next(AppError.notFound('Cliente no encontrado'));
    res.json({ client });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/client/:id ───────────────────────────────────
export const deleteClient = async (req, res, next) => {
  try {
    const companyId = req.user.company?._id || req.user.company;
    const soft = req.query.soft !== 'false';

    const client = await Client.findOne({
      _id: req.params.id,
      company: companyId,
      deleted: false,
    });

    if (!client) return next(AppError.notFound('Cliente no encontrado'));

    if (soft) {
      client.deleted = true;
      await client.save();
      return res.json({ message: 'Cliente archivado correctamente' });
    }

    await client.deleteOne();
    res.json({ message: 'Cliente eliminado definitivamente' });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/client/:id/restore ───────────────────────────
export const restoreClient = async (req, res, next) => {
  try {
    const companyId = req.user.company?._id || req.user.company;
    const client = await Client.findOne({
      _id: req.params.id,
      company: companyId,
      deleted: true,
    });

    if (!client) return next(AppError.notFound('Cliente archivado no encontrado'));

    client.deleted = false;
    await client.save();

    res.json({ message: 'Cliente restaurado correctamente', client });
  } catch (err) {
    next(err);
  }
};
