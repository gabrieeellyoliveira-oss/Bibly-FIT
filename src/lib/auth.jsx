import { createContext, useContext, useEffect, useState } from 'react'
import { openedFromRecoveryLink, supabase } from './supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(!supabase)
  const [recovering, setRecovering] = useState(openedFromRecoveryLink)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      if (event === 'PASSWORD_RECOVERY') setRecovering(true)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const value = {
    cloud: !!supabase,
    ready,
    session,
    user: session?.user ?? null,
    recovering,
    doneRecovering: () => setRecovering(false),
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

const MESSAGES = [
  ['Invalid login credentials', 'E-mail ou senha incorretos.'],
  ['Email not confirmed', 'Confirme seu e-mail antes de entrar (veja sua caixa de entrada).'],
  ['User already registered', 'Esse e-mail já tem conta. Toque em “Entrar”.'],
  ['Password should be at least', 'A senha precisa ter pelo menos 6 caracteres.'],
  ['Unable to validate email', 'Esse e-mail não parece válido.'],
  ['rate limit', 'Muitas tentativas seguidas. Espere alguns minutos e tente de novo.'],
  ['Signups not allowed', 'Novos cadastros estão desativados.'],
  ['Failed to fetch', 'Sem conexão com a internet.'],
]

export function authMessage(error) {
  const msg = error?.message || ''
  const hit = MESSAGES.find(([en]) => msg.toLowerCase().includes(en.toLowerCase()))
  return hit ? hit[1] : msg || 'Algo deu errado. Tente de novo.'
}
