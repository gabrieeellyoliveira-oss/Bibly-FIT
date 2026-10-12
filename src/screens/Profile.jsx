import { useState } from 'react'
import Icon from '../components/Icon'
import Icon3D from '../components/Icon3D'
import { PageHeader, Sheet, toast } from '../components/ui'
import { go } from '../lib/router'
import { hashPin, useStore } from '../lib/store'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { fmtBR } from '../lib/dates'
import { achievements } from '../lib/progress'

export default function Profile() {
  const { state, update } = useStore()
  const { user } = useAuth()
  const { profile, measures } = state
  const [pinOpen, setPinOpen] = useState(false)
  const [newPin, setNewPin] = useState('')
  const [pinError, setPinError] = useState('')

  const setProfile = (patch) => update((s) => ({ profile: { ...s.profile, ...patch } }))
  const { list, total } = achievements(state)
  const unlocked = list.filter((a) => a.unlocked).length
  const lastMeasure = [...measures].sort((a, b) => a.date.localeCompare(b.date)).at(-1)

  const savePin = async (e) => {
    e.preventDefault()
    if (!/^\d{4}$/.test(newPin)) return setPinError('O PIN precisa ter exatamente 4 números.')
    const h = await hashPin(newPin)
    update(() => ({ pinHash: h }))
    sessionStorage.setItem('bibly:photos-unlocked', '1')
    setNewPin('')
    setPinError('')
    setPinOpen(false)
    toast('PIN criado. Suas fotos estão protegidas')
  }

  const removePin = () => {
    if (!confirm('Remover o PIN das fotos?')) return
    update(() => ({ pinHash: null }))
    toast('PIN removido')
  }

  const logout = () => {
    if (!confirm('Sair da sua conta neste aparelho?')) return
    sessionStorage.removeItem('bibly:photos-unlocked')
    supabase.auth.signOut()
  }

  return (
    <div className="stack">
      <PageHeader title="Meu perfil" subtitle="Seu espaço, do seu jeito" />

      <section className="profile-card">
        <div className="profile-avatar" aria-hidden="true">
          {(profile.name || 'B').slice(0, 1).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
          <label className="profile-label" htmlFor="profile-name">
            Como quer ser chamada?
          </label>
          <input
            id="profile-name"
            className="profile-name-input"
            value={profile.name}
            placeholder="Seu nome"
            onChange={(e) => setProfile({ name: e.target.value })}
          />
          <div className="profile-email">
            {total} {total === 1 ? 'treino concluído' : 'treinos concluídos'} · {unlocked} {unlocked === 1 ? 'conquista' : 'conquistas'}
          </div>
        </div>
      </section>

      <section>
        <p className="group-title">Minha meta</p>
        <div className="group">
          <div className="row">
            <span className="row-icon">
              <Icon3D name="calendar" size={30} />
            </span>
            <span className="row-text">
              <span className="row-title">Dias de treino</span>
              <span className="row-sub">por semana</span>
            </span>
            <Stepper value={profile.weeklyGoal} min={1} max={7} onChange={(v) => setProfile({ weeklyGoal: v })} label="dias de treino por semana" />
          </div>
          <div className="row">
            <span className="row-icon">
              <Icon3D name="camera" size={30} />
            </span>
            <span className="row-text">
              <span className="row-title">Fotos de evolução</span>
              <span className="row-sub">por mês</span>
            </span>
            <Stepper value={profile.photoGoal} min={1} max={30} onChange={(v) => setProfile({ photoGoal: v })} label="fotos por mês" />
          </div>
        </div>
      </section>

      <section>
        <p className="group-title">Evolução</p>
        <div className="group">
          <button className="row" onClick={() => go('/evolucao')}>
            <span className="row-icon">
              <Icon3D name="tape" size={30} />
            </span>
            <span className="row-text">
              <span className="row-title">Medidas</span>
              <span className="row-sub">{lastMeasure ? `Último registro em ${fmtBR(lastMeasure.date)}` : 'Nenhum registro ainda'}</span>
            </span>
            <Icon name="chevronRight" size={18} className="row-chevron" />
          </button>
          <button className="row" onClick={() => go('/evolucao')}>
            <span className="row-icon">
              <Icon3D name="trophy" size={30} />
            </span>
            <span className="row-text">
              <span className="row-title">Conquistas</span>
              <span className="row-sub">
                {unlocked} de {list.length} desbloqueadas
              </span>
            </span>
            <Icon name="chevronRight" size={18} className="row-chevron" />
          </button>
        </div>
      </section>

      <section>
        <p className="group-title">Privacidade</p>
        <div className="group">
          <div className="row">
            <span className="row-icon">
              <Icon3D name="lock" size={30} />
            </span>
            <span className="row-text">
              <span className="row-title">PIN das fotos</span>
              <span className="row-sub">{state.pinHash ? 'Ativado: fotos protegidas' : 'Desativado'}</span>
            </span>
            {state.pinHash ? (
              <button className="btn btn-outline btn-sm" onClick={removePin}>
                Remover
              </button>
            ) : (
              <button className="btn btn-secondary btn-sm" onClick={() => setPinOpen(true)}>
                Criar PIN
              </button>
            )}
          </div>
        </div>
      </section>

      <section>
        <p className="group-title">Conta e dados</p>
        <div className="group">
          {user ? (
            <div className="row">
              <span className="row-icon">
                <Icon3D name="user" size={30} />
              </span>
              <span className="row-text">
                <span className="row-title">Minha conta</span>
                <span className="row-sub" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.email}
                </span>
              </span>
              <button className="btn btn-outline btn-sm" onClick={logout}>
                Sair
              </button>
            </div>
          ) : null}
          <div className="row">
            <span className="row-icon">
              <Icon3D name="check" size={30} />
            </span>
            <span className="row-text">
              <span className="row-title">Seus dados</span>
              <span className="row-sub">
                {user
                  ? 'Treinos, medidas e fotos salvos na sua conta. Só você tem acesso.'
                  : 'Salvos neste aparelho. Só você tem acesso.'}
              </span>
            </span>
          </div>
        </div>
      </section>

      <Sheet open={pinOpen} onClose={() => setPinOpen(false)} title="Criar PIN das fotos">
        <form className="form" onSubmit={savePin} noValidate>
          <p className="sheet-hint">Com o PIN, suas fotos só abrem depois de digitar os 4 números.</p>
          <label className="field">
            PIN de 4 números
            <input
              className="input"
              inputMode="numeric"
              maxLength={4}
              autoFocus
              aria-invalid={!!pinError}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              style={{ letterSpacing: '0.5em', textAlign: 'center', fontSize: 22 }}
            />
          </label>
          {pinError && (
            <p className="alert alert-error" role="alert">
              {pinError}
            </p>
          )}
          <button className="btn btn-primary btn-lg btn-block" type="submit">
            Salvar PIN
          </button>
        </form>
      </Sheet>
    </div>
  )
}

function Stepper({ value, min, max, onChange, label }) {
  return (
    <div className="stepper">
      <button onClick={() => onChange(Math.max(min, value - 1))} aria-label={`Diminuir ${label}`} disabled={value <= min}>
        <Icon name="minus" size={16} />
      </button>
      <strong aria-live="polite">{value}</strong>
      <button onClick={() => onChange(Math.min(max, value + 1))} aria-label={`Aumentar ${label}`} disabled={value >= max}>
        <Icon name="plus" size={16} />
      </button>
    </div>
  )
}
