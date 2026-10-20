const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads', 'documentos');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// RF-11: si CLOUDINARY_URL está configurado, los documentos se suben a Cloudinary
// (plan gratuito); si no, se cae a disco local servido vía /uploads, igual que
// contratos (RF-04) y los PDF de liquidaciones (RF-10). Esto permite desarrollar y
// correr los tests sin crear una cuenta externa, y evita hardcodear un proveedor
// (RNF-08: portabilidad). La librería `cloudinary` lee CLOUDINARY_URL del entorno
// automáticamente.
function obtenerCloudinary() {
  if (!process.env.CLOUDINARY_URL) return null;
  return require('cloudinary').v2;
}

function extraerPublicId(url) {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
  return match ? match[1] : null;
}

/** Sube un archivo al proveedor configurado y devuelve la URL pública para guardar en BD. */
async function subirArchivo(buffer, nombreOriginal) {
  const cloudinary = obtenerCloudinary();

  if (cloudinary) {
    const resultado = await cloudinary.uploader.upload(
      `data:application/octet-stream;base64,${buffer.toString('base64')}`,
      { folder: 'documentos', resource_type: 'auto', use_filename: true },
    );
    return resultado.secure_url;
  }

  const sufijo = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const nombreArchivo = `${sufijo}${path.extname(nombreOriginal)}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, nombreArchivo), buffer);
  return `/uploads/documentos/${nombreArchivo}`;
}

/** Elimina el archivo detrás de una URL devuelta por subirArchivo (best-effort). */
async function eliminarArchivoPorUrl(url) {
  if (!url) return;

  if (url.startsWith('/uploads/documentos/')) {
    fs.rmSync(path.join(UPLOAD_DIR, path.basename(url)), { force: true });
    return;
  }

  const cloudinary = obtenerCloudinary();
  if (!cloudinary || !url.includes('cloudinary.com')) return;
  const publicId = extraerPublicId(url);
  if (publicId) await cloudinary.uploader.destroy(publicId, { resource_type: 'auto' });
}

module.exports = { subirArchivo, eliminarArchivoPorUrl };
