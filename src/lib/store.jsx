import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { seedWorkouts } from './seed'

const KEY = 'bibly:v1'

const initialState = () => ({
  version: 1,
  profile: { name: 'Bibi', weeklyGoal: 5, photoGoal: 6 },
  workouts: seedWorkouts(),
  logs: [], // { id, date: 'YYYY-MM-DD', workoutId }
  measures: [], // { id, date, weight, waist, hip, thigh, arm }
  photos: [], // { id, date, pose } — a imagem fica no IndexedDB
  pinHash: null,
})

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...initialState(), ...JSON.parse(raw) }
  } catch {
    /* ignora dados corrompidos */
  }
  return initialState()
}

const StoreContext = createContext(null)

export function StoreProvider({ children }) {
  const [state, setState] = useState(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* armazenamento cheio ou bloqueado */
    }
  }, [state])

  const update = useCallback((fn) => setState((s) => ({ ...s, ...fn(s) })), [])

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
