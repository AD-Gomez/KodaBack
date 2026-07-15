import multer from 'multer';

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const cedulaUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE_BYTES, files: 2 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new Error('Solo se permiten imágenes'));
      return;
    }
    cb(null, true);
  },
});