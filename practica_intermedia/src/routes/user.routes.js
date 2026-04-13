import { Router } from 'express';
import {
  register, validateEmail, login,
  updatePersonalData, updateCompany, uploadLogo,
  getUser, refreshToken, logout,
  deleteUser, changePassword, inviteUser,
} from '../controllers/user.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';
import { validate } from '../middleware/validate.js';
import { upload } from '../middleware/upload.js';
import {
  registerSchema, verifyEmailSchema, loginSchema,
  personalDataSchema, companySchema,
  changePasswordSchema, inviteSchema, refreshTokenSchema,
} from '../validators/user.validator.js';

const router = Router();

//Auth
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshTokenSchema), refreshToken);
router.post('/logout', authMiddleware, logout);

//Validación email
router.put('/validation', authMiddleware, validate(verifyEmailSchema), validateEmail);

//Onboarding
router.put('/register', authMiddleware, validate(personalDataSchema), updatePersonalData);
router.patch('/company', authMiddleware, validate(companySchema), updateCompany);
router.patch('/logo', authMiddleware, upload.single('logo'), uploadLogo);

//Perfil
router.get('/', authMiddleware, getUser);
router.delete('/', authMiddleware, deleteUser);

router.put('/password', authMiddleware, validate(changePasswordSchema), changePassword);

//Invitar (solo admin)
router.post('/invite', authMiddleware, requireRole('admin'), validate(inviteSchema), inviteUser);

export default router;
