import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Link de "esqueci a senha" chega com type=recovery no endereço; lemos antes do cliente limpar
export const openedFromRecoveryLink = typeof location !== 'undefined' && /type=recovery/.test(location.hash)

// Sem as variáveis, o app roda em modo local (dados só no aparelho, sem login)
export const supabase = url && key ? createClient(url, key) : null
