import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../../src/models/User.js';
import Company from '../../src/models/Company.js';
import Client from '../../src/models/Client.js';
import Project from '../../src/models/Project.js';

export const createAdminUser = async () => {
  const password = await bcrypt.hash('password123', 10);
  const user = await User.create({
    email: 'admin@test.com',
    password,
    name: 'Admin',
    lastName: 'Test',
    nif: '12345678A',
    role: 'admin',
    status: 'verified',
  });
  return user;
};

export const createGuestUser = async (companyId) => {
  const password = await bcrypt.hash('password123', 10);
  const user = await User.create({
    email: 'guest@test.com',
    password,
    name: 'Guest',
    lastName: 'Test',
    role: 'guest',
    status: 'verified',
    company: companyId,
  });
  return user;
};

export const createCompany = async (ownerId) => {
  const company = await Company.create({
    owner: ownerId,
    name: 'Test Company S.L.',
    cif: 'B99999999',
    address: { street: 'Calle Test', city: 'Madrid' },
  });
  // Asignar compañía al propietario
  await User.findByIdAndUpdate(ownerId, { company: company._id });
  return company;
};

export const createClient = async (userId, companyId) => {
  return Client.create({
    user: userId,
    company: companyId,
    name: 'Cliente Test S.L.',
    cif: 'A11111111',
    email: 'cliente@test.com',
  });
};

export const createProject = async (userId, companyId, clientId) => {
  return Project.create({
    user: userId,
    company: companyId,
    client: clientId,
    name: 'Proyecto Test',
    projectCode: 'TEST-001',
  });
};

export const getToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_ACCESS_SECRET || 'test_access_secret_32chars_minimum',
    { expiresIn: '1h' }
  );
};
