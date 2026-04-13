import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Company from '../models/Company.js';
import { AppError } from '../utils/AppError.js';
import { config } from '../config/index.js';
import { notificationService } from '../services/notification.service.js';

//JWT helpers
const generateAccessToken = (userId) =>
  jwt.sign({ userId }, config.jwt.accessSecret, { expiresIn: config.jwt.accessExpires });

const generateRefreshToken = (userId) =>
  jwt.sign({ userId }, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpires });

const generateVerificationCode = () =>
  String(Math.floor(100000 + Math.random() * 900000));

//1) Registro
export const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    //Verificamos si ya existe el usuario con ese email
    const existing = await User.findOne({ email, deleted: false });
    if (existing && existing.status === 'verified') {
      return next(AppError.conflict('Ya existe una cuenta verificada con ese email'));
    }

    const hashed = await bcrypt.hash(password, 10);
    const verificationCode = generateVerificationCode();
    const refreshToken = generateRefreshToken('temp');

    let user;
    if (existing) {
      //Actualizar código
      existing.password = hashed;
      existing.verificationCode = verificationCode;
      existing.verificationAttempts = 3;
      existing.status = 'pending';
      await existing.save();
      user = existing;
    } else {
      user = await User.create({
        email,
        password: hashed,
        verificationCode,
        verificationAttempts: 3,
        role: 'admin',
        status: 'pending',
      });
    }

    const accessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
    user.refreshToken = newRefreshToken;
    await user.save();

    notificationService.emit('user:registered', { email: user.email, verificationCode });

    res.status(201).json({
      user: { email: user.email, status: user.status, role: user.role },
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    next(err);
  }
};

//2) Validación email
export const validateEmail = async (req, res, next) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user._id);

    if (user.status === 'verified') {
      return res.json({ message: 'Email ya verificado' });
    }

    if (user.verificationAttempts <= 0) {
      return next(AppError.tooManyRequests('Has agotado los intentos de verificación'));
    }

    if (user.verificationCode !== code) {
      user.verificationAttempts -= 1;
      await user.save();

      if (user.verificationAttempts <= 0) {
        return next(AppError.tooManyRequests('Has agotado los intentos de verificación'));
      }

      return next(AppError.badRequest(`Código incorrecto. Intentos restantes: ${user.verificationAttempts}`));
    }

    user.status = 'verified';
    user.verificationCode = undefined;
    await user.save();

    notificationService.emit('user:verified', { email: user.email });

    res.json({ message: 'Email verificado correctamente' });
  } catch (err) {
    next(err);
  }
};

//3) Login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, deleted: false });
    if (!user) return next(AppError.unauthorized('Credenciales inválidas'));

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return next(AppError.unauthorized('Credenciales inválidas'));

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      user: { email: user.email, status: user.status, role: user.role },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

//4 Onboarding — Datos personales
export const updatePersonalData = async (req, res, next) => {
  try {
    const { name, lastName, nif, address } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, lastName, nif, address },
      { new: true, runValidators: true }
    ).populate('company');

    res.json({ user });
  } catch (err) {
    next(err);
  }
};

//4)Onboarding — Datos de compañía
export const updateCompany = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    let companyData = req.body;

    //Si es autónomo, usa datos del usuario
    if (companyData.isFreelance) {
      if (!user.nif) {
        return next(AppError.badRequest('Debes completar tus datos personales antes (NIF requerido para autónomos)'));
      }
      companyData = {
        name: user.fullName || user.name,
        cif: user.nif,
        address: user.address,
        isFreelance: true,
      };
    }

    //Buscar si ya existe una Company con ese CIF
    const existingCompany = await Company.findOne({ cif: companyData.cif, deleted: false });

    if (existingCompany) {
      //Unirse a la compañía existente como guest
      user.company = existingCompany._id;
      user.role = 'guest';
      await user.save();
      return res.json({ message: 'Te has unido a la compañía existente', company: existingCompany });
    }

    //Crear nueva compañía
    const company = await Company.create({
      owner: user._id,
      name: companyData.name,
      cif: companyData.cif,
      address: companyData.address,
      isFreelance: companyData.isFreelance || false,
    });

    user.company = company._id;
    await user.save();

    res.status(201).json({ message: 'Compañía creada correctamente', company });
  } catch (err) {
    next(err);
  }
};

//5) Logo compañía 
export const uploadLogo = async (req, res, next) => {
  try {
    if (!req.user.company) {
      return next(AppError.badRequest('Debes completar el onboarding de compañía primero'));
    }
    if (!req.file) {
      return next(AppError.badRequest('No se ha subido ninguna imagen'));
    }

    const logoUrl = `/uploads/${req.file.filename}`;
    await Company.findByIdAndUpdate(req.user.company, { logo: logoUrl });

    res.json({ message: 'Logo actualizado correctamente', logo: logoUrl });
  } catch (err) {
    next(err);
  }
};

//6) Obtener usuario
export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -verificationCode -refreshToken')
      .populate('company');

    res.json({ user });
  } catch (err) {
    next(err);
  }
};

//7) Refresh token
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    } catch {
      return next(AppError.unauthorized('Refresh token inválido o expirado'));
    }

    const user = await User.findById(decoded.userId);
    if (!user || user.refreshToken !== refreshToken || user.deleted) {
      return next(AppError.unauthorized('Refresh token inválido'));
    }

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    next(err);
  }
};

//7) Logout
export const logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    res.json({ message: 'Sesión cerrada correctamente' });
  } catch (err) {
    next(err);
  }
};

//8) Eliminar usuario
export const deleteUser = async (req, res, next) => {
  try {
    const soft = req.query.soft === 'true';

    if (soft) {
      await User.findByIdAndUpdate(req.user._id, { deleted: true, refreshToken: null });
      notificationService.emit('user:deleted', { email: req.user.email, type: 'soft' });
      return res.json({ message: 'Usuario desactivado correctamente (soft delete)' });
    }

    const user = await User.findByIdAndDelete(req.user._id);
    notificationService.emit('user:deleted', { email: user.email, type: 'hard' });
    res.json({ message: 'Usuario eliminado definitivamente' });
  } catch (err) {
    next(err);
  }
};

//9) Cambiar contraseña 
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return next(AppError.badRequest('La contraseña actual es incorrecta'));

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    next(err);
  }
};

//10) Invitar compañero
export const inviteUser = async (req, res, next) => {
  try {
    const { email, name, lastName } = req.body;

    if (!req.user.company) {
      return next(AppError.badRequest('Debes tener una compañía para invitar usuarios'));
    }

    const existing = await User.findOne({ email, deleted: false });
    if (existing) return next(AppError.conflict('Ya existe un usuario con ese email'));

    const tempPassword = Math.random().toString(36).slice(-10) + 'A1!';
    const hashed = await bcrypt.hash(tempPassword, 10);
    const verificationCode = generateVerificationCode();

    const invitedUser = await User.create({
      email,
      name,
      lastName,
      password: hashed,
      role: 'guest',
      status: 'pending',
      company: req.user.company,
      verificationCode,
      verificationAttempts: 3,
    });

    notificationService.emit('user:invited', {
      invitedEmail: email,
      invitedBy: req.user.email,
      tempPassword,
      verificationCode,
    });

    res.status(201).json({
      message: 'Usuario invitado correctamente',
      user: { email: invitedUser.email, role: invitedUser.role, status: invitedUser.status },
    });
  } catch (err) {
    next(err);
  }
};
