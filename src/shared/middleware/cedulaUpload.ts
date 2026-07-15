import multer from 'multer';

import { ValidationError } from '../errors/index.js';

const MAX_SIZE_BYTES = 10 * 1024 * 1024;

export const cedulaUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_BYTES, files: 2 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new ValidationError('Solo se permiten imágenes'));
      return;
    }
    cb(null, true);
  },
});