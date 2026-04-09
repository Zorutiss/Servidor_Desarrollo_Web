import prisma from '../config/prisma.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';

const safeUser = (user) => {
  const { password, ...rest } = user;
  return rest;
};

export const register = async (req, res, next) => {
  try {
    const { email, name, password, role } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }

    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, name, password: hashed, role: role || 'USER' },
    });

    return res.status(201).json({ user: safeUser(user) });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = generateToken(user.id);
    return res.status(200).json({ token, user: safeUser(user) });
  } catch (error) {
    next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    return res.status(200).json({ user: safeUser(req.user) });
  } catch (error) {
    next(error);
  }
};
