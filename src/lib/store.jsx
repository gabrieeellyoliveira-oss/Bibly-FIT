import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'
import { WORKOUT_NAMES } from './seed'
import { localGet, setPhotoUser, uploadPhoto } from './photos'
import { toast } from '../components/ui'

const LOCAL_KEY = 'bibly:v1' // modo local (sem login)
const MIGRATED_KEY = 'bibly:migrated-to' // dados do modo local já enviados para esta conta
const cacheKey = (uid) => (uid ? `${LOCAL_KEY}:${uid}` : LOCAL_KEY)

const initialState = () => ({
  version: 1,
  profile: { name: '', weeklyGoal: 5, photoGoal: 6 },
  workouts: [], // conta nova começa vazia; treinos sugeridos ficam a um toque (Treinos)
  logs: [], // { id, date: 'YYYY-MM-DD', workoutId, startedAt?, durationMin?, completed?, total? }
  session: null, // treino em andamento: { workoutId, startedAt, done: [exerciseId] }
  restDays: [], // ['YYYY-MM-DD'] dias marcados como descanso
  measures: [], // { id, date, weight, waist, hip, thigh, arm }
  photos: [], // { id, date, pose, pending? } — a imagem fica no IndexedDB / Storage
  pinHash: null,
})

function readJson(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// Renomeia os treinos sugeridos que ainda estão com o nome antigo ("Treino A/B/C")
const renameSuggested = (workouts) =>
  workouts.map((w) => (WORKOUT_NAMES[w.id] && w.name === 'Treino ' + w.id ? { ...w, name: WORKOUT_NAMES[w.id] } : w))

const withDefaults = (data) => {
  const s = { ...initialState(), ...(data || {}) }
  return { ...s, workouts: renameSuggested(s.workouts) }
}

// Envia fotos que ficaram só no aparelho (sem internet na hora, ou vindas do modo local)
async function flushPendingPhotos(photos, update) {
  for (const p of photos) {
    const blob = await localGet(p.id).catch(() => null)
    if (blob && (await uploadPhoto(p.id, blob))) {
      update((s) => ({ photos: s.photos.map((x) => (x.id === p.id ? { ...x, pending: false } : x)) }))
    }
  }
}

const StoreContext = createContext(null)

export function StoreProvider({ user, children }) {
  const uid = user?.id ?? null
  const cached = useRef(readJson(cacheKey(uid)))
  const [state, setState] = useState(() => withDefaults(cached.current))
  const [synced, setSynced] = useState(!uid) // nuvem carregada: só então salvamos lá
  const warned = useRef(false)
  const userRef = useRef(user)
  userRef.current = user

  const update = useCallback((fn) => setState((s) => ({ ...s, ...fn(s) })), [])

  // Ao entrar: busca os dados da conta; se a conta é nova, leva os dados deste aparelho
  useEffect(() => {
    setPhotoUser(uid)
    if (!uid) return
    let alive = true
    ;(async () => {
      const { data, error } = await supabase.from('app_state').select('data').eq('user_id', uid).maybeSingle()
      if (!alive) return
      if (error) {
        toast('Sem conexão com a nuvem. Mostrando a cópia do aparelho.')
        return
      }
      let next
      if (data) {
        next = withDefaults(data.data)
      } else {
        const legacy = localStorage.getItem(MIGRATED_KEY) ? null : readJson(LOCAL_KEY)
        next = withDefaults(cached.current || legacy)
        if (!cached.current && legacy) next.photos = next.photos.map((p) => ({ ...p, pending: true }))
        if (!next.profile.name && userRef.current?.user_metadata?.name)
          next.profile = { ...next.profile, name: userRef.current.user_metadata.name }
        const { error: e } = await supabase.from('app_state').upsert({ user_id: uid, data: next })
        if (!alive) return
        if (e) {
          toast('Não foi possível salvar na nuvem agora.')
          return
        }
        localStorage.setItem(MIGRATED_KEY, uid)
      }
      setState(next)
      setSynced(true)
      const pending = next.photos.filter((p) => p.pending)
      if (pending.length) flushPendingPhotos(pending, update)
    })()
    return () => {
      alive = false
    }
  }, [uid, update])

  // Salva no aparelho sempre e, com login, na nuvem (agrupando mudanças rápidas)
  useEffect(() => {
    try {
      localStorage.setItem(cacheKey(uid), JSON.stringify(state))
    } catch {
      /* armazenamento cheio ou bloqueado */
    }
    if (!uid || !synced) return
    const t = setTimeout(async () => {
      const { error } = await supabase
        .from('app_state')
        .upsert({ user_id: uid, data: state, updated_at: new Date().toISOString() })
      if (error && !warned.current) {
        warned.current = true
        toast('Não consegui salvar na nuvem. Tento de novo na próxima mudança.')
      } else if (!error) warned.current = false
    }, 700)
    return () => clearTimeout(t)
  }, [state, uid, synced])

  if (uid && !synced && !cached.current) {
    return (
      <div className="splash">
        <div className="brand">
          bibly<span className="brand-dot">.</span>
        </div>
        <span className="spinner" aria-label="Carregando" />
        <p className="muted">Carregando seus dados…</p>
      </div>
    )
  }

  return <StoreContext.Provider value={{ state, update }}>{children}</StoreContext.Provider>
}

export const useStore = () => useContext(StoreContext)

// Próximo treino da rotação: o seguinte ao último concluído
export function nextWorkout(state) {
  const { workouts, logs } = state
  if (!workouts.length) return null
  const last = [...logs].sort((a, b) => a.date.localeCompare(b.date)).at(-1)
  if (!last) return workouts[0]
  const i = workouts.findIndex((w) => w.id === last.workoutId)
  return workouts[(i + 1) % workouts.length]
}

export async function hashPin(pin) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('bibly:' + pin))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
