import { useState } from 'react'
import Icon from '../components/Icon'
import Icon3D from '../components/Icon3D'
import { Empty, PageHeader, SectionHead, Sheet, toast } from '../components/ui'
import { go } from '../lib/router'
import { nextWorkout, useStore } from '../lib/store'
import { fmtBR, toKey, uid } from '../lib/dates'
import { seedWorkouts } from '../lib/seed'
import { imageUrl, workoutAccent, workoutCover } from '../lib/exerciseImages'

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`

export default function Workouts({ query }) {
  const { state, update } = useStore()
  const { workouts, logs, session } = state
  const next = nextWorkout(state)
  const today = toKey()
  const [creating, setCreating] = useState(query === 'novo')
  const [form, setForm] = useState({ name: '', focus: '', duration: '45–60 min' })
  const [error, setError] = useState('')

  const history = [...logs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8)

  const status = (w) => {
    if (session?.workoutId === w.id) return { label: 'Em andamento', cls: 'badge-live' }
    if (logs.some((l) => l.workoutId === w.id && l.date === today)) return { label: '✓ Feito hoje', cls: 'badge-done' }
    if (next?.id === w.id) return { label: 'Próximo', cls: 'badge-primary' }
    return null
  }

  const create = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return setError('Dê um nome ao treino.')
    const id = 'w' + uid()
    update((s) => ({
      workouts: [...s.workouts, { id, name: form.name.trim(), focus: form.focus.trim(), duration: form.duration.trim(), exercises: [] }],
    }))
    setCreating(false)
    setError('')
    setForm({ name: '', focus: '', duration: '45–60 min' })
    toast('Treino criado. Agora adicione os exercícios')
    go('/treinos/' + id)
  }

  return (
    <div className="stack">
      <PageHeader title="Meus treinos" subtitle="Sua biblioteca pessoal" />

      {workouts.length === 0 ? (
        <section className="card">
          <Empty
            icon="dumbbell"
            title="Sua biblioteca está vazia"
            text="Crie um treino do seu jeito ou comece com três treinos prontos e ajuste como quiser."
          />
          <div className="stack-sm">
            <button className="btn btn-primary btn-lg btn-block" onClick={() => setCreating(true)}>
              Montar meu primeiro treino
            </button>
            <button
              className="btn btn-secondary btn-block"
              onClick={() => {
                update(() => ({ workouts: seedWorkouts() }))
                toast('Treinos sugeridos adicionados')
              }}
            >
              Usar treinos sugeridos
            </button>
          </div>
        </section>
      ) : (
        <div className="wlist">
          {workouts.map((w) => {
            const cover = imageUrl(workoutCover(w), true)
            const st = status(w)
            return (
              <button key={w.id} className={`wcard card-press accent-${workoutAccent(w)}`} onClick={() => go('/treinos/' + w.id)}>
                <div className="wcard-cover">
                  {cover ? <img src={cover} alt="" loading="lazy" /> : <Icon3D name="dumbbell" size={72} />}
                  {st && <span className={'badge ' + st.cls}>{st.label}</span>}
                </div>
                <div className="wcard-body">
                  <div className="wcard-text">
                    <div className="wcard-title">{w.name}</div>
                    {w.focus && <div className="wcard-cat">{w.focus}</div>}
                    <div className="wcard-meta">
                      <span>
                        <Icon name="dumbbell" size={13} /> {plural(w.exercises.length, 'exercício', 'exercícios')}
                      </span>
                      {w.duration && (
                        <span>
                          <Icon name="clock" size={13} /> {w.duration}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="wcard-go" aria-hidden="true">
                    <Icon name="play" size={15} fill />
                  </span>
                </div>
              </button>
            )
          })}

          <button className="add-card" onClick={() => setCreating(true)}>
            <Icon3D name="sparkle" size={42} />
            <span className="row-text">
              <strong>Criar novo treino</strong>
              <small>Monte do seu jeito</small>
            </span>
            <Icon name="plus" size={20} className="row-chevron" />
          </button>
        </div>
      )}

      {history.length > 0 && (
        <section className="card">
          <SectionHead title="Últimos treinos" />
          <ul className="history">
            {history.map((l) => {
              const w = workouts.find((x) => x.id === l.workoutId)
              return (
                <li key={l.id}>
                  <span className="history-dot" />
                  <span className="history-date">{fmtBR(l.date).slice(0, 5)}</span>
                  <span className="row-text">
                    <span className="row-title" style={{ fontSize: 14 }}>
                      {w ? w.name : 'Treino removido'}
                    </span>
                    <span className="row-sub">
                      {[w?.focus, l.durationMin ? `${l.durationMin} min` : null].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <Sheet open={creating} onClose={() => setCreating(false)} title="Novo treino">
        <form onSubmit={create} className="form" noValidate>
          <label className="field">
            Nome
            <input
              className="input"
              aria-invalid={!!error}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex.: Queima Total"
              autoFocus
            />
          </label>
          <label className="field">
            Categoria
            <input className="input" value={form.focus} onChange={(e) => setForm({ ...form, focus: e.target.value })} placeholder="Ex.: Inferiores" />
          </label>
          <label className="field">
            Duração
            <input className="input" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
          </label>
          {error && (
            <p className="alert alert-error" role="alert">
              {error}
            </p>
          )}
          <button className="btn btn-primary btn-lg btn-block" type="submit">
            Criar treino
          </button>
        </form>
      </Sheet>
    </div>
  )
}
