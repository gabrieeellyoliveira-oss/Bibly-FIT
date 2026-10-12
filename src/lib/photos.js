import { supabase } from './supabase'

// Fotos ficam no IndexedDB do aparelho (cache) e, com login, também no Supabase Storage
const DB = 'bibly-photos'
const STORE = 'photos'
const BUCKET = 'photos'

let cloudUser = null
export const setPhotoUser = (uid) => {
  cloudUser = supabase && uid ? uid : null
}
const cloudPath = (id) => `${cloudUser}/${id}.jpg`

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

const localPut = (id, blob) => run('readwrite', (s) => s.put(blob, id))
export const localGet = (id) => run('readonly', (s) => s.get(id))
const localDelete = (id) => run('readwrite', (s) => s.delete(id))

// Envia para a nuvem; retorna false se não conseguiu (fica pendente no aparelho)
export async function uploadPhoto(id, blob) {
  if (!cloudUser) return true
  const { error } = await supabase.storage.from(BUCKET).upload(cloudPath(id), blob, {
    contentType: 'image/jpeg',
    upsert: true,
  })
  return !error
}

export async function putPhoto(id, blob) {
  await localPut(id, blob)
  return uploadPhoto(id, blob)
}

export async function getPhoto(id) {
  const cached = await localGet(id)
  if (cached || !cloudUser) return cached
  const { data, error } = await supabase.storage.from(BUCKET).download(cloudPath(id))
  if (error || !data) return null
  await localPut(id, data)
  return data
}

export async function deletePhoto(id) {
  await localDelete(id)
  if (cloudUser) await supabase.storage.from(BUCKET).remove([cloudPath(id)])
}

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
