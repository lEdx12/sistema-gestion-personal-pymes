const multer = require('multer');

const TIPOS_PERMITIDOS = ['application/pdf', 'image/png', 'image/jpeg'];
const TAMANO_MAXIMO_BYTES = 10 * 1024 * 1024; // 10MB

// Almacenamiento en memoria (no en disco): el buffer se entrega a
// almacenamiento.service.js, que decide si va a Cloudinary o a disco local (RF-11).
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: TAMANO_MAXIMO_BYTES },
  fileFilter: (req, file, cb) => {
    if (!TIPOS_PERMITIDOS.includes(file.mimetype)) {
      return cb(new Error('Tipo de archivo no permitido (solo PDF, PNG o JPG)'));
    }
    cb(null, true);
  },
});

/** Envuelve multer para devolver errores de subida como JSON 400, no HTML. */
function subirDocumento(req, res, next) {
  upload.single('documento')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}

module.exports = subirDocumento;
