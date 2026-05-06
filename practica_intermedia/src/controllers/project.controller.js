import Project from '../models/Project.js';
import Client from '../models/Client.js';
import { AppError } from '../utils/AppError.js';
import { getIO } from '../socket/index.js';

// POST /api/project
export const createProject = async (req, res, next) => {
  try {
    const companyId = req.user.company?._id || req.user.company;
    if (!companyId) {
      return next(AppError.badRequest('Debes completar el onboarding de compañía primero'));
    }

    const { name, projectCode, client, email, address, notes } = req.body;

    const clientDoc = await Client.findOne({ _id: client, company: companyId, deleted: false });
    if (!clientDoc) return next(AppError.notFound('Cliente no encontrado en tu compañía'));

    const existing = await Project.findOne({ projectCode, company: companyId, deleted: false });
    if (existing) {
      return next(AppError.conflict('Ya existe un proyecto con ese código en tu compañía'));
    }

    const project = await Project.create({
      user: req.user._id,
      company: companyId,
      client,
      name,
      projectCode,
      email,
      address,
      notes,
    });

    const populated = await project.populate([{ path: 'client', select: 'name cif email' }]);

    // NOTIFICAR A TODOS LOS USUARIOS DE LA COMPAÑIA
    try { getIO().to(companyId.toString()).emit('project:new', { project: populated }); } catch {}

    res.status(201).json({ project: populated });
  } catch (err) {
    next(err);
  }
};

// PUT /api/project/:id 
export const updateProject = async (req, res, next) => {
  try {
    const companyId = req.user.company?._id || req.user.company;
    const project = await Project.findOne({ _id: req.params.id, company: companyId, deleted: false });

    if (!project) return next(AppError.notFound('Proyecto no encontrado'));

    if (req.body.projectCode && req.body.projectCode !== project.projectCode) {
      const existing = await Project.findOne({
        projectCode: req.body.projectCode,
        company: companyId,
        deleted: false,
        _id: { $ne: project._id },
      });
      if (existing) return next(AppError.conflict('Ya existe un proyecto con ese código'));
    }

    if (req.body.client) {
      const clientDoc = await Client.findOne({ _id: req.body.client, company: companyId, deleted: false });
      if (!clientDoc) return next(AppError.notFound('Cliente no encontrado en tu compañía'));
    }

    Object.assign(project, req.body);
    await project.save();

    const populated = await project.populate([{ path: 'client', select: 'name cif email' }]);
    res.json({ project: populated });
  } catch (err) {
    next(err);
  }
};

// GET /api/project
export const getProjects = async (req, res, next) => {
  try {
    const companyId = req.user.company?._id || req.user.company;
    const { page = 1, limit = 10, name, client, sort = '-createdAt' } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const filter = { company: companyId, deleted: false };
    if (name) filter.name = { $regex: name, $options: 'i' };
    if (client) filter.client = client;

    const [projects, totalItems] = await Promise.all([
      Project.find(filter).populate('client', 'name cif').sort(sort).skip(skip).limit(parseInt(limit)),
      Project.countDocuments(filter),
    ]);

    res.json({
      projects,
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

// GET /api/project/archived
export const getArchivedProjects = async (req, res, next) => {
  try {
    const companyId = req.user.company?._id || req.user.company;
    const projects = await Project.find({ company: companyId, deleted: true }).populate('client', 'name cif');
    res.json({ projects });
  } catch (err) {
    next(err);
  }
};

// GET /api/project/:id
export const getProjectById = async (req, res, next) => {
  try {
    const companyId = req.user.company?._id || req.user.company;
    const project = await Project.findOne({ _id: req.params.id, company: companyId, deleted: false })
      .populate('client', 'name cif email phone');

    if (!project) return next(AppError.notFound('Proyecto no encontrado'));
    res.json({ project });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/project/:id
export const deleteProject = async (req, res, next) => {
  try {
    const companyId = req.user.company?._id || req.user.company;
    const soft = req.query.soft !== 'false';

    const project = await Project.findOne({ _id: req.params.id, company: companyId, deleted: false });
    if (!project) return next(AppError.notFound('Proyecto no encontrado'));

    if (soft) {
      project.deleted = true;
      await project.save();
      return res.json({ message: 'Proyecto archivado correctamente' });
    }

    await project.deleteOne();
    res.json({ message: 'Proyecto eliminado definitivamente' });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/project/:id/restore
export const restoreProject = async (req, res, next) => {
  try {
    const companyId = req.user.company?._id || req.user.company;
    const project = await Project.findOne({ _id: req.params.id, company: companyId, deleted: true });

    if (!project) return next(AppError.notFound('Proyecto archivado no encontrado'));

    project.deleted = false;
    await project.save();

    res.json({ message: 'Proyecto restaurado correctamente', project });
  } catch (err) {
    next(err);
  }
};
