const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'contratos');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const TIPOS_PERMITIDOS = ['application/pdf', 'image/png', 'image/jpeg'];
const TAMANO_MAXIMO_BYTES = 10 * 1024 * 1024; // 10MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const sufijo = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `contrato-${req.params.id}-${sufijo}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: TAMANO_MAXIMO_BYTES },
  fileFilter: (req, file, cb) => {
    if (!TIPOS_PERMITIDOS.includes(file.mimetype)) {
      return cb(new Error('Tipo de archivo no permitido (solo PDF, PNG o JPG)'));
    }
    cb(null, true);
  },
});

/** Middleware que envuelve multer para devolver errores de subida como JSON 400, no HTML. */
function subirDocumentoContrato(req, res, next) {
  upload.single('documento')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}

module.exports = subirDocumentoContrato;
