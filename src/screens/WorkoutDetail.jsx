import { useEffect, useState } from 'react'
import Icon from '../components/Icon'
import { PageHeader, toast } from '../components/ui'
import { go } from '../lib/router'
import { useStore } from '../lib/store'
import { toKey, uid } from '../lib/dates'

const elapsed = (t) => {
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000))
  const h = Math.floor(s / 3600)
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const sec = String(s % 60).padStart(2, '0')
  return h ? `${h}:${m}:${sec}` : `${m}:${sec}`
}

export default function WorkoutDetail({ id, query }) {
  const { state, update } = useStore()
  const workout = state.workouts.find((w) => w.id === id)
  const [editing, setEditing] = useState(false)
  const [, tick] = useState(0)
  const today = toKey()
  const session = state.session?.workoutId === id ? state.session : null
  const otherSession = state.session && !session ? state.workouts.find((w) => w.id === state.session.workoutId) : null
  const doneToday = state.logs.find((l) => l.date === today && l.workoutId === id)
  const checks = new Set(session?.done || [])

  // Cronômetro do treino em andamento
  useEffect(() => {
    if (!session) return
    const t = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [session])

  // Vindo do botão "Começar treino" da tela inicial
  useEffect(() => {
    if (query === 'comecar' && workout && !session) start()
    if (query) history.replaceState(null, '', '#/treinos/' + encodeURIComponent(id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!workout) {
    return (
      <div>
        <PageHeader title="Treino" onBack={() => go('/treinos')} />
        <p className="empty">Esse treino não existe mais.</p>
      </div>
    )
  }

  function start() {
    if (!workout.exercises.length) {
      toast('Adicione exercícios antes de começar')
      setEditing(true)
      return
    }
    if (otherSession && !confirm(`Você está no meio do ${otherSession.name}. Encerrar sem salvar e começar o ${workout.name}?`)) return
    update(() => ({ session: { workoutId: id, startedAt: Date.now(), done: [] } }))
    toast('Bom treino! ♥')
  }

  const toggle = (exId) => {
    if (!session) {
      toast('Toque em “Começar treino” para marcar os exercícios')
      return
    }
    update((s) => {
      const done = new Set(s.session.done)
      done.has(exId) ? done.delete(exId) : done.add(exId)
      return { session: { ...s.session, done: [...done] } }
    })
  }

  const finish = () => {
    const completed = workout.exercises.filter((e) => checks.has(e.id)).length
    if (completed === 0 && !confirm('Nenhum exercício marcado. Concluir o treino mesmo assim?')) return
    const durationMin = Math.max(1, Math.round((Date.now() - session.startedAt) / 60000))
    update((s) => ({
      session: null,
      restDays: s.restDays.filter((d) => d !== today),
      logs: [
        ...s.logs,
        {
          id: uid(),
          date: today,
          workoutId: id,
          startedAt: session.startedAt,
          durationMin,
          completed,
          total: workout.exercises.length,
        },
      ],
    }))
    toast(`Treino concluído em ${durationMin} min. Arrasou! ♥`)
    go('/')
  }

  const cancel = () => {
    if (!confirm('Cancelar este treino? O progresso desta sessão não será salvo.')) return
    update(() => ({ session: null }))
    toast('Treino cancelado')
  }

  const undoToday = () => {
    if (!confirm('Remover o registro do treino de hoje?')) return
    update((s) => ({ logs: s.logs.filter((l) => l.id !== doneToday.id) }))
    toast('Registro de hoje removido')
  }

  const setWorkout = (patch) =>
    update((s) => ({ workouts: s.workouts.map((w) => (w.id === id ? { ...w, ...patch } : w)) }))

  const setExercise = (exId, patch) =>
    setWorkout({ exercises: workout.exercises.map((e) => (e.id === exId ? { ...e, ...patch } : e)) })

  const removeExercise = (e) => {
    if (!confirm(`Remover “${e.name || 'exercício sem nome'}” do treino?`)) return
    setWorkout({ exercises: workout.exercises.filter((x) => x.id !== e.id) })
    if (session) update((s) => ({ session: { ...s.session, done: s.session.done.filter((d) => d !== e.id) } }))
    toast('Exercício removido')
  }

  const toggleEditing = () => {
    if (editing) {
      const blank = workout.exercises.filter((e) => !e.name.trim())
      if (blank.length) setWorkout({ exercises: workout.exercises.filter((e) => e.name.trim()) })
      toast('Treino salvo')
    }
    setEditing(!editing)
  }

  const removeWorkout = () => {
    if (!confirm(`Excluir ${workout.name}? Os registros de treinos feitos continuam no histórico.`)) return
    update((s) => ({
      workouts: s.workouts.filter((w) => w.id !== id),
      session: s.session?.workoutId === id ? null : s.session,
    }))
    toast('Treino excluído')
    go('/treinos')
  }

  const doneCount = workout.exercises.filter((e) => checks.has(e.id)).length

  return (
    <div>
      <PageHeader
        title={workout.name}
        subtitle={[workout.focus, workout.duration].filter(Boolean).join(' · ')}
        onBack={() => go('/treinos')}
        right={
          <button className="icon-btn" onClick={toggleEditing} aria-label={editing ? 'Salvar edição' : 'Editar treino'}>
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

      {!editing && session && (
        <div className="session-bar">
          <span className="session-live" />
          <span>Em andamento</span>
          <strong className="session-time">{elapsed(session.startedAt)}</strong>
          <span className="session-count">
            {doneCount}/{workout.exercises.length}
          </span>
        </div>
      )}

      {!editing && session && workout.exercises.length > 0 && (
        <div className="progress-bar">
          <span style={{ width: `${(doneCount / workout.exercises.length) * 100}%` }} />
        </div>
      )}

      {!editing && otherSession && (
        <p className="hint hint-box">
          O {otherSession.name} está em andamento.{' '}
          <button className="link-soft" onClick={() => go('/treinos/' + state.session.workoutId)}>
            Voltar para ele
          </button>
        </p>
      )}

      <ul className="exercises">
        {workout.exercises.map((e, i) =>
          editing ? (
            <li key={e.id} className="card exercise exercise-edit">
              <input
                className="ex-name-input"
                value={e.name}
                onChange={(ev) => setExercise(e.id, { name: ev.target.value })}
                placeholder="Nome do exercício"
              />
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
              <button className="link-danger" onClick={() => removeExercise(e)}>
                <Icon name="trash" size={16} /> Remover
              </button>
            </li>
          ) : (
            <li key={e.id}>
              <button
                className={'card exercise' + (checks.has(e.id) ? ' exercise-done' : '') + (session ? '' : ' exercise-idle')}
                onClick={() => toggle(e.id)}
              >
                <span className="ex-index">{i + 1}</span>
                <span className="ex-body">
                  <span className="ex-name">{e.name}</span>
                  <span className="ex-meta">
                    {e.sets} × {e.reps}
                    {e.rest && <> · descanso {e.rest}</>}
                  </span>
                </span>
                {session && <span className="ex-check">{checks.has(e.id) && <Icon name="check" size={16} strokeWidth={2.6} />}</span>}
              </button>
            </li>
          ),
        )}
      </ul>

      {workout.exercises.length === 0 && !editing && (
        <div className="empty-state">
          <Icon name="dumbbell" size={28} />
          <p>Nenhum exercício ainda.</p>
          <button className="btn-small" onClick={() => setEditing(true)}>
            <Icon name="plus" size={14} /> Adicionar exercícios
          </button>
        </div>
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
          <button className="btn-primary" onClick={toggleEditing}>
            Salvar treino <Icon name="check" size={18} />
          </button>
          <button className="btn-ghost-danger" onClick={removeWorkout}>
            Excluir treino
          </button>
        </>
      ) : session ? (
        <div className="session-actions">
          <button className="btn-primary" onClick={finish}>
            Concluir treino <Icon name="check" size={18} />
          </button>
          <button className="btn-ghost-danger" onClick={cancel}>
            Cancelar treino
          </button>
        </div>
      ) : workout.exercises.length > 0 ? (
        <div className="session-actions">
          {doneToday && (
            <p className="done-note">
              <Icon name="check" size={15} strokeWidth={2.4} /> Você concluiu este treino hoje
              {doneToday.durationMin ? ` em ${doneToday.durationMin} min` : ''}.
              <button className="link-soft" onClick={undoToday}>
                Desfazer
              </button>
            </p>
          )}
          <button className={doneToday ? 'btn-secondary' : 'btn-primary'} onClick={start}>
            <Icon name="play" size={15} fill /> {doneToday ? 'Treinar de novo' : 'Começar treino'}
          </button>
        </div>
      ) : null}
    </div>
  )
}
