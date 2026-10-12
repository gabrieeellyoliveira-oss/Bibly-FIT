import { useState } from 'react'
import Icon from '../components/Icon'
import { PageHeader, toast } from '../components/ui'
import { go } from '../lib/router'
import { hashPin, useStore } from '../lib/store'
import { fmtBR, toKey, uid } from '../lib/dates'

const FIELDS = [
  { key: 'weight', label: 'Peso', unit: 'kg' },
  { key: 'waist', label: 'Cintura', unit: 'cm' },
  { key: 'hip', label: 'Quadril', unit: 'cm' },
  { key: 'thigh', label: 'Coxa', unit: 'cm' },
  { key: 'arm', label: 'Braço', unit: 'cm' },
]

export default function Profile() {
  const { state, update } = useStore()
  const { profile, measures } = state
  const today = toKey()
  const todays = measures.find((m) => m.date === today)
  const [form, setForm] = useState(() => Object.fromEntries(FIELDS.map((f) => [f.key, todays?.[f.key] ?? ''])))
  const [newPin, setNewPin] = useState('')

  const setProfile = (patch) => update((s) => ({ profile: { ...s.profile, ...patch } }))

  const saveMeasures = (e) => {
    e.preventDefault()
    const entry = { id: todays?.id || uid(), date: today }
    FIELDS.forEach((f) => {
      const v = String(form[f.key]).replace(',', '.').trim()
      entry[f.key] = v === '' || isNaN(Number(v)) ? '' : Number(v)
    })
    update((s) => ({ measures: [...s.measures.filter((m) => m.date !== today), entry] }))
    toast('Medidas salvas ♥')
  }

  const savePin = async () => {
    if (!/^\d{4}$/.test(newPin)) return toast('O PIN precisa ter 4 números')
    const h = await hashPin(newPin)
    update(() => ({ pinHash: h }))
    sessionStorage.setItem('bibly:photos-unlocked', '1')
    setNewPin('')
    toast('PIN criado. Suas fotos estão protegidas')
  }

  const history = [...measures].sort((a, b) => b.date.localeCompare(a.date))
  const first = [...measures].sort((a, b) => a.date.localeCompare(b.date))[0]

  return (
    <div>
      <PageHeader title="Meu perfil" subtitle="Seu espaço, do seu jeito." onBack={() => go('/')} />

      <section className="card profile-head">
        <div className="avatar">{(profile.name || 'B').slice(0, 1).toUpperCase()}</div>
        <label className="grow">
          <span className="label-sm">Como quer ser chamada?</span>
          <input className="input-plain serif" value={profile.name} onChange={(e) => setProfile({ name: e.target.value })} />
        </label>
      </section>

      <section className="card">
        <h2 className="card-head-title">Minhas metas</h2>
        <Stepper label="Dias de treino por semana" value={profile.weeklyGoal} min={1} max={7} onChange={(v) => setProfile({ weeklyGoal: v })} />
        <Stepper label="Fotos por mês" value={profile.photoGoal} min={1} max={30} onChange={(v) => setProfile({ photoGoal: v })} />
      </section>

      <section className="card">
        <h2 className="card-head-title">Medidas de hoje</h2>
        <form className="measure-grid" onSubmit={saveMeasures}>
          {FIELDS.map((f) => (
            <label key={f.key}>
              {f.label}
              <span className="unit-input">
                <input inputMode="decimal" value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} placeholder="—" />
                <small>{f.unit}</small>
              </span>
            </label>
          ))}
          <button className="btn-primary measure-save" type="submit">
            Salvar medidas
          </button>
        </form>

        {history.length > 0 && (
          <ul className="measure-history">
            {history.map((m) => (
              <li key={m.id}>
                <div className="mh-date">{fmtBR(m.date)}</div>
                <div className="mh-values">
                  {FIELDS.filter((f) => m[f.key] !== '' && m[f.key] != null).map((f) => {
                    const diff = first && first !== m && first[f.key] ? m[f.key] - first[f.key] : null
                    return (
                      <span key={f.key}>
                        {f.label} {m[f.key]}
                        {f.unit}
                        {diff ? <em className={diff < 0 ? 'down' : 'up'}> {diff > 0 ? '+' : ''}{diff.toFixed(1)}</em> : null}
                      </span>
                    )
                  })}
                </div>
                <button
                  className="icon-btn icon-btn-sm"
                  aria-label="Excluir medida"
                  onClick={() => confirm('Excluir essas medidas?') && update((s) => ({ measures: s.measures.filter((x) => x.id !== m.id) }))}
                >
                  <Icon name="trash" size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2 className="card-head-title">Privacidade das fotos</h2>
        {state.pinHash ? (
          <div className="row-between">
            <span className="muted">
              <Icon name="lock" size={14} /> Fotos protegidas por PIN
            </span>
            <button className="btn-small" onClick={() => confirm('Remover o PIN das fotos?') && update(() => ({ pinHash: null }))}>
              Remover PIN
            </button>
          </div>
        ) : (
          <div className="row-between">
            <input
              className="pin-input"
              inputMode="numeric"
              maxLength={4}
              placeholder="PIN de 4 números"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
            />
            <button className="btn-small" onClick={savePin}>
              Criar PIN
            </button>
          </div>
        )}
      </section>

      <p className="private-note">Seus dados ficam salvos neste aparelho.</p>
    </div>
  )
}

function Stepper({ label, value, min, max, onChange }) {
  return (
    <div className="stepper">
      <span>{label}</span>
      <div className="stepper-ctrl">
        <button onClick={() => onChange(Math.max(min, value - 1))} aria-label="Diminuir">
          <Icon name="minus" size={16} />
        </button>
        <strong>{value}</strong>
        <button onClick={() => onChange(Math.min(max, value + 1))} aria-label="Aumentar">
          <Icon name="plus" size={16} />
        </button>
      </div>
    </div>
  )
}
