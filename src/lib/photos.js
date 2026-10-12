// Fotos ficam no IndexedDB do aparelho (cabem bem mais que no localStorage)
const DB = 'bibly-photos'
const STORE = 'photos'

let dbPromise
function openDb() {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

async function run(mode, fn) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode)
    const req = fn(tx.objectStore(STORE))
    tx.oncomplete = () => resolve(req.result)
    tx.onerror = () => reject(tx.error)
  })
}

export const putPhoto = (id, blob) => run('readwrite', (s) => s.put(blob, id))
export const getPhoto = (id) => run('readonly', (s) => s.get(id))
export const deletePhoto = (id) => run('readwrite', (s) => s.delete(id))

// Reduz a foto para no máximo 1400px e converte para JPEG
export function compressImage(file, max = 1400, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(img.naturalWidth * scale)
      canvas.height = Math.round(img.naturalHeight * scale)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Falha ao processar a foto'))), 'image/jpeg', quality)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Não foi possível ler a foto'))
    }
    img.src = url
  })
}
