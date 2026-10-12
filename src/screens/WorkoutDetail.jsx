import { useEffect, useState } from 'react'
import Icon from '../components/Icon'
import { PageHeader, toast } from '../components/ui'
import { go } from '../lib/router'
import { useStore } from '../lib/store'
import { toKey, uid } from '../lib/dates'

// Exercícios marcados durante o treino de hoje (somem no dia seguinte)
const checksKey = (id) => `bibly:checks:${toKey()}:${id}`
const loadChecks = (id) => {
  try {
    return new Set(JSON.parse(localStorage.getItem(checksKey(id)) || '[]'))
  } catch {
    return new Set()
  }
}

export default function WorkoutDetail({ id }) {
  const { state, update } = useStore()
  const workout = state.workouts.find((w) => w.id === id)
  const [checks, setChecks] = useState(() => loadChecks(id))
  const [editing, setEditing] = useState(false)
  const today = toKey()
  const doneToday = state.logs.find((l) => l.date === today && l.workoutId === id)

  useEffect(() => {
    try {
      localStorage.setItem(checksKey(id), JSON.stringify([...checks]))
    } catch {
      /* ignora */
    }
  }, [checks, id])

  if (!workout) {
    return (
      <div>
        <PageHeader title="Treino" onBack={() => go('/treinos')} />
        <p className="empty">Esse treino não existe mais.</p>
      </div>
    )
  }

  const toggle = (exId) =>
    setChecks((s) => {
      const n = new Set(s)
      n.has(exId) ? n.delete(exId) : n.add(exId)
      return n
    })

  const setWorkout = (patch) =>
    update((s) => ({ workouts: s.workouts.map((w) => (w.id === id ? { ...w, ...patch } : w)) }))

  const setExercise = (exId, patch) =>
    setWorkout({ exercises: workout.exercises.map((e) => (e.id === exId ? { ...e, ...patch } : e)) })

  const finish = () => {
    if (doneToday) {
      update((s) => ({ logs: s.logs.filter((l) => l !== doneToday) }))
      toast('Registro de hoje desfeito')
      return
    }
    update((s) => ({ logs: [...s.logs, { id: uid(), date: today, workoutId: id }] }))
    toast('Treino concluído! Arrasou ♥')
    go('/')
  }

  const removeWorkout = () => {
    if (!confirm(`Excluir ${workout.name}? Os registros de treinos feitos continuam no histórico.`)) return
    update((s) => ({ workouts: s.workouts.filter((w) => w.id !== id) }))
    go('/treinos')
  }

  const doneCount = workout.exercises.filter((e) => checks.has(e.id)).length

  return (
    <div>
      <PageHeader
        title={workout.name}
        subtitle={`${workout.focus} · ${workout.duration}`}
        onBack={() => go('/treinos')}
        right={
          <button className="icon-btn" onClick={() => setEditing(!editing)} aria-label={editing ? 'Concluir edição' : 'Editar treino'}>
            <Icon name={editing ? 'check' : 'edit'} size={22} />
          </button>
        }
      />

      {editing && (
        <section className="card form">
          <label>
            Nome
            <input value={workout.name} onChange={(e) => setWorkout({ name: e.target.value })} />
          </label>
          <div className="form-row">
            <label>
              Foco
              <input value={workout.focus} onChange={(e) => setWorkout({ focus: e.target.value })} />
            </label>
            <label>
              Duração
              <input value={workout.duration} onChange={(e) => setWorkout({ duration: e.target.value })} />
            </label>
          </div>
        </section>
      )}

      {!editing && workout.exercises.length > 0 && (
        <div className="progress-line">
          <div className="progress-bar">
            <span style={{ width: `${(doneCount / workout.exercises.length) * 100}%` }} />
          </div>
          <span className="muted">
            {doneCount}/{workout.exercises.length}
          </span>
        </div>
      )}

      <ul className="exercises">
        {workout.exercises.map((e, i) =>
          editing ? (
            <li key={e.id} className="card exercise exercise-edit">
              <input className="ex-name-input" value={e.name} onChange={(ev) => setExercise(e.id, { name: ev.target.value })} placeholder="Nome do exercício" />
              <div className="form-row form-row-3">
                <label>
                  Séries
                  <input inputMode="numeric" value={e.sets} onChange={(ev) => setExercise(e.id, { sets: ev.target.value })} />
                </label>
                <label>
                  Reps
                  <input value={e.reps} onChange={(ev) => setExercise(e.id, { reps: ev.target.value })} />
                </label>
                <label>
                  Descanso
                  <input value={e.rest} onChange={(ev) => setExercise(e.id, { rest: ev.target.value })} />
                </label>
              </div>
              <button
                className="link-danger"
                onClick={() => setWorkout({ exercises: workout.exercises.filter((x) => x.id !== e.id) })}
              >
                <Icon name="trash" size={16} /> Remover
              </button>
            </li>
          ) : (
            <li key={e.id}>
              <button className={'card exercise' + (checks.has(e.id) ? ' exercise-done' : '')} onClick={() => toggle(e.id)}>
                <span className="ex-index">{i + 1}</span>
                <span className="ex-body">
                  <span className="ex-name">{e.name}</span>
                  <span className="ex-meta">
                    {e.sets} × {e.reps}
                    {e.rest && <> · descanso {e.rest}</>}
                  </span>
                </span>
                <span className="ex-check">{checks.has(e.id) && <Icon name="check" size={16} strokeWidth={2.6} />}</span>
              </button>
            </li>
          ),
        )}
      </ul>

      {workout.exercises.length === 0 && !editing && (
        <p className="empty">Nenhum exercício ainda. Toque no lápis para montar seu treino.</p>
      )}

      {editing ? (
        <>
          <button
            className="add-row"
            onClick={() => setWorkout({ exercises: [...workout.exercises, { id: uid(), name: '', sets: 3, reps: '12', rest: '60s' }] })}
          >
            <span className="add-icon">
              <Icon name="plus" size={22} />
            </span>
            <span className="add-text">
              <strong>Adicionar exercício</strong>
            </span>
          </button>
          <button className="btn-ghost-danger" onClick={removeWorkout}>
            Excluir treino
          </button>
        </>
      ) : (
        <button className={doneToday ? 'btn-secondary' : 'btn-primary'} onClick={finish}>
          {doneToday ? 'Concluído hoje · desfazer' : 'Concluir treino'}
          <Icon name="check" size={18} />
        </button>
      )}
    </div>
  )
}
