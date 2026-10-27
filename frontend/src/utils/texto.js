/** Normaliza texto a un slug apto para nombre de archivo (sin tildes/ñ, minúsculas, guiones). */
export function slugificar(texto) {
  return (texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
