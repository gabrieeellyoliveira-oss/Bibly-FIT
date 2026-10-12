import { useState } from 'react'
import Icon from '../components/Icon'
import { PageHeader, Sheet } from '../components/ui'
import { go } from '../lib/router'
import { nextWorkout, useStore } from '../lib/store'
import { fmtBR } from '../lib/dates'

export default function Workouts() {
  const { state, update } = useStore()
  const { workouts, logs } = state
  const next = nextWorkout(state)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', focus: '', duration: '45–60 min' })

  const lastDone = (id) =>
    logs
      .filter((l) => l.workoutId === id)
      .map((l) => l.date)
      .sort()
      .at(-1)

  const history = [...logs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10)

  const create = (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    const used = new Set(workouts.map((w) => w.id))
    let id = String.fromCharCode(65 + workouts.length)
    while (used.has(id)) id += '1'
    update((s) => ({
      workouts: [...s.workouts, { id, name: form.name.trim(), focus: form.focus.trim(), duration: form.duration.trim(), exercises: [] }],
    }))
    setCreating(false)
    setForm({ name: '', focus: '', duration: '45–60 min' })
    go('/treinos/' + id)
  }

  return (
    <div>
      <PageHeader title="Meus treinos" subtitle="Constância é o seu superpoder." onBack={() => go('/')} />

      <div className="list">
        {workouts.map((w) => {
          const last = lastDone(w.id)
          return (
            <button key={w.id} className="card list-card" onClick={() => go('/treinos/' + w.id)}>
              <div className={'icon-tile' + (next?.id === w.id ? '' : ' icon-tile-soft')}>
                <Icon name="dumbbell" size={24} strokeWidth={2.4} />
              </div>
              <div className="list-body">
                <div className="list-title">
                  {w.name}
                  {next?.id === w.id && <span className="pill">próximo</span>}
                </div>
                <div className="list-sub">{w.focus}</div>
                <div className="list-meta">
                  {w.exercises.length} exercícios · {w.duration}
                  {last && <> · feito em {fmtBR(last).slice(0, 5)}</>}
                </div>
              </div>
              <Icon name="chevronRight" size={18} className="muted" />
            </button>
          )
        })}
      </div>

      <button className="add-row" onClick={() => setCreating(true)}>
        <span className="add-icon">
          <Icon name="plus" size={22} />
        </span>
        <span className="add-text">
          <strong>Criar novo treino</strong>
          <small>Monte do seu jeito</small>
        </span>
        <Icon name="chevronRight" size={18} className="muted" />
      </button>

      {history.length > 0 && (
        <section className="card">
          <h2 className="card-head-title">Últimos treinos</h2>
          <ul className="history">
            {history.map((l) => {
              const w = workouts.find((x) => x.id === l.workoutId)
              return (
                <li key={l.id}>
                  <span className="legend-dot" />
                  <span>{fmtBR(l.date)}</span>
                  <span className="muted">{w ? `${w.name} · ${w.focus}` : 'Treino removido'}</span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <Sheet open={creating} onClose={() => setCreating(false)} title="Novo treino">
        <form onSubmit={create} className="form">
          <label>
            Nome
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Treino D" autoFocus />
          </label>
          <label>
            Foco
            <input value={form.focus} onChange={(e) => setForm({ ...form, focus: e.target.value })} placeholder="Ex.: Posterior & glúteos" />
          </label>
          <label>
            Duração
            <input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
          </label>
          <button className="btn-primary" type="submit">
            Criar treino <Icon name="arrowRight" size={18} />
          </button>
        </form>
      </Sheet>
    </div>
  )
}
