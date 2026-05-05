import multer from 'multer';
import path from 'path';
import { AppError } from '../utils/AppError.js';

// Para logos — guarda en disco
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `logo_${req.user._id}_${Date.now()}${ext}`);
  },
});

// Para firmas — guarda en memoria (para Cloudinary)
const signatureStorage = multer.memoryStorage();

const imageFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(AppError.badRequest('Solo se permiten imágenes (jpeg, png, webp)'));
  }
};

export const upload = multer({
  storage: logoStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const uploadSignature = multer({
  storage: signatureStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});