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

/**
 * @swagger
 * /api/user/register:
 *   post:
 *     summary: Registrar nuevo usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       201:
 *         description: Usuario registrado, se envía email con código
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: Email ya registrado
 */
router.post('/register', validate(registerSchema), register);

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso, devuelve accessToken y refreshToken
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/login', validate(loginSchema), login);

/**
 * @swagger
 * /api/user/refresh:
 *   post:
 *     summary: Renovar access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Nuevos tokens generados
 *       401:
 *         description: Refresh token inválido
 */
router.post('/refresh', validate(refreshTokenSchema), refreshToken);

/**
 * @swagger
 * /api/user/logout:
 *   post:
 *     summary: Cerrar sesión
 *     tags: [Auth]
 *     security:
 *       - BearerToken: []
 *     responses:
 *       200:
 *         description: Sesión cerrada
 */
router.post('/logout', authMiddleware, logout);

/**
 * @swagger
 * /api/user/validation:
 *   put:
 *     summary: Verificar email con código de 6 dígitos
 *     tags: [Auth]
 *     security:
 *       - BearerToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Email verificado
 *       400:
 *         description: Código incorrecto
 *       429:
 *         description: Intentos agotados
 */
router.put('/validation', authMiddleware, validate(verifyEmailSchema), validateEmail);

/**
 * @swagger
 * /api/user/register:
 *   put:
 *     summary: Actualizar datos personales (onboarding paso 1)
 *     tags: [Onboarding]
 *     security:
 *       - BearerToken: []
 *     responses:
 *       200:
 *         description: Datos actualizados
 */
router.put('/register', authMiddleware, validate(personalDataSchema), updatePersonalData);

/**
 * @swagger
 * /api/user/company:
 *   patch:
 *     summary: Crear o unirse a compañía (onboarding paso 2)
 *     tags: [Onboarding]
 *     security:
 *       - BearerToken: []
 *     responses:
 *       201:
 *         description: Compañía creada
 *       200:
 *         description: Unido a compañía existente
 */
router.patch('/company', authMiddleware, validate(companySchema), updateCompany);

/**
 * @swagger
 * /api/user/logo:
 *   patch:
 *     summary: Subir logo de compañía
 *     tags: [Onboarding]
 *     security:
 *       - BearerToken: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Logo actualizado
 */
router.patch('/logo', authMiddleware, upload.single('logo'), uploadLogo);

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: Obtener perfil del usuario autenticado
 *     tags: [Usuario]
 *     security:
 *       - BearerToken: []
 *     responses:
 *       200:
 *         description: Perfil completo con company
 */
router.get('/', authMiddleware, getUser);

/**
 * @swagger
 * /api/user:
 *   delete:
 *     summary: Eliminar cuenta (soft o hard delete)
 *     tags: [Usuario]
 *     security:
 *       - BearerToken: []
 *     parameters:
 *       - in: query
 *         name: soft
 *         schema:
 *           type: boolean
 *         description: true = desactivar, false = eliminar definitivamente
 *     responses:
 *       200:
 *         description: Usuario eliminado
 */
router.delete('/', authMiddleware, deleteUser);

/**
 * @swagger
 * /api/user/password:
 *   put:
 *     summary: Cambiar contraseña
 *     tags: [Usuario]
 *     security:
 *       - BearerToken: []
 *     responses:
 *       200:
 *         description: Contraseña actualizada
 */
router.put('/password', authMiddleware, validate(changePasswordSchema), changePassword);

/**
 * @swagger
 * /api/user/invite:
 *   post:
 *     summary: Invitar compañero a la compañía (solo admin)
 *     tags: [Usuario]
 *     security:
 *       - BearerToken: []
 *     responses:
 *       201:
 *         description: Invitación enviada por email
 *       403:
 *         description: Solo admins pueden invitar
 */
router.post('/invite', authMiddleware, requireRole('admin'), validate(inviteSchema), inviteUser);

export default router;
