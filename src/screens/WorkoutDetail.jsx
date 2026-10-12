import { useEffect, useState } from 'react'
import Icon from '../components/Icon'
import { PageHeader, Sheet, toast } from '../components/ui'
import { go } from '../lib/router'
import { useStore } from '../lib/store'
import { fmtBR, toKey, uid } from '../lib/dates'
import { exerciseSlug, imageUrl, workoutCover } from '../lib/exerciseImages'

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
  const [collapsed, setCollapsed] = useState(false)
  const [showing, setShowing] = useState(null)
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
    const marking = !checks.has(exId)
    update((s) => {
      const done = new Set(s.session.done)
      done.has(exId) ? done.delete(exId) : done.add(exId)
      return { session: { ...s.session, done: [...done] } }
    })
    // Mostra a imagem do próximo exercício lá em cima
    if (marking) setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 250)
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
  // Durante o treino, a capa mostra o exercício atual (o primeiro ainda não feito)
  const current = session ? workout.exercises.find((e) => !checks.has(e.id)) : null
  const currentIndex = current ? workout.exercises.indexOf(current) : -1
  const allDone = session && workout.exercises.length > 0 && !current
  const cover = imageUrl(current ? exerciseSlug(current) || workoutCover(workout) : workoutCover(workout))
  const totalSets = workout.exercises.reduce((n, e) => n + (parseInt(e.sets, 10) || 0), 0)
  const lastLog = [...state.logs]
    .filter((l) => l.workoutId === id)
    .sort((a, b) => a.date.localeCompare(b.date))
    .at(-1)

  return (
    <div className="detail">
      <div className={'detail-hero' + (cover ? '' : ' detail-hero-empty')}>
        {cover ? <img key={cover} className="hero-img" src={cover} alt={current ? current.name : ''} /> : <Icon name="dumbbell" size={56} strokeWidth={1.6} />}
        {current && (
          <div className="hero-now">
            <span className="hero-now-label">Agora · {currentIndex + 1} de {workout.exercises.length}</span>
            <strong>{current.name}</strong>
            <span className="hero-now-meta">
              {current.sets} × {current.reps}
              {current.rest && <> · descanso {current.rest}</>}
            </span>
          </div>
        )}
        {allDone && (
          <div className="hero-now hero-now-done">
            <strong>Todos os exercícios feitos!</strong>
            <span className="hero-now-meta">Toque em Concluir treino ♥</span>
          </div>
        )}
        <button className="hero-btn hero-back" onClick={() => go('/treinos')} aria-label="Voltar">
          <Icon name="chevronLeft" size={22} />
        </button>
        <button className="hero-btn hero-edit" onClick={toggleEditing} aria-label={editing ? 'Salvar edição' : 'Editar treino'}>
          <Icon name={editing ? 'check' : 'edit'} size={19} />
        </button>
      </div>

      <div className="detail-sheet">
        <h1 className="serif detail-title">{workout.name}</h1>
        {workout.focus && <p className="detail-sub">{workout.focus}</p>}

        <div className="chips">
          <span className="chip">
            <Icon name="dumbbell" size={15} /> {workout.exercises.length} {workout.exercises.length === 1 ? "exercício" : "exercícios"}
          </span>
          {workout.duration && (
            <span className="chip">
              <Icon name="clock" size={15} /> {workout.duration}
            </span>
          )}
          {totalSets > 0 && (
            <span className="chip">
              <Icon name="flame" size={15} /> {totalSets} séries
            </span>
          )}
        </div>

        {lastLog && !session && (
          <p className="detail-last">
            Último treino: {fmtBR(lastLog.date)}
            {lastLog.durationMin ? ` · ${lastLog.durationMin} min` : ''}
          </p>
        )}

        {editing && (
          <section className="form detail-edit">
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
          <>
            <div className="session-bar">
              <span className="session-live" />
              <span>Em andamento</span>
              <strong className="session-time">{elapsed(session.startedAt)}</strong>
              <span className="session-count">
                {doneCount}/{workout.exercises.length}
              </span>
            </div>
            <div className="progress-bar">
              <span style={{ width: `${(doneCount / Math.max(1, workout.exercises.length)) * 100}%` }} />
            </div>
          </>
        )}

        {!editing && otherSession && (
          <p className="hint hint-box">
            O {otherSession.name} está em andamento.{' '}
            <button className="link-soft" onClick={() => go('/treinos/' + state.session.workoutId)}>
              Voltar para ele
            </button>
          </p>
        )}

        <section className="ex-section">
          <button className="ex-section-head" onClick={() => setCollapsed(!collapsed)} aria-expanded={!collapsed}>
            <span>Exercícios</span>
            <span className={'ex-toggle' + (collapsed ? ' closed' : '')}>
              <Icon name="chevronLeft" size={16} />
            </span>
          </button>

          {!collapsed && (
            <ul className="ex-list">
              {workout.exercises.map((e, i) => {
                const thumb = imageUrl(exerciseSlug(e), true)
                if (editing) {
                  return (
                    <li key={e.id} className="ex-item ex-item-edit">
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
                  )
                }
                const done = checks.has(e.id)
                return (
                  <li key={e.id}>
                    <div className={'ex-item' + (done ? ' ex-item-done' : '') + (current?.id === e.id ? ' ex-item-current' : '')}>
                      <button className="ex-thumb" onClick={() => setShowing(e)} aria-label={`Ver ${e.name}`}>
                        {thumb ? <img src={thumb} alt="" loading="lazy" /> : <span className="ex-thumb-num">{i + 1}</span>}
                      </button>
                      <button className="ex-main" onClick={() => (session ? toggle(e.id) : setShowing(e))}>
                        <span className="ex-name">
                          {e.name}
                          {current?.id === e.id && <span className="pill pill-now">agora</span>}
                        </span>
                        <span className="ex-meta">
                          <Icon name="clock" size={13} /> {e.sets} × {e.reps}
                          {e.rest && <> · {e.rest}</>}
                        </span>
                      </button>
                      {session ? (
                        <button
                          className={'ex-check' + (done ? ' on' : '')}
                          onClick={() => toggle(e.id)}
                          aria-label={done ? 'Desmarcar' : 'Marcar como feito'}
                        >
                          {done && <Icon name="check" size={16} strokeWidth={2.6} />}
                        </button>
                      ) : (
                        <button className="ex-arrow" onClick={() => setShowing(e)} aria-label={`Ver ${e.name}`}>
                          <Icon name="chevronRight" size={18} />
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}

          {workout.exercises.length === 0 && !editing && (
            <div className="empty-state">
              <Icon name="dumbbell" size={28} />
              <p>Nenhum exercício ainda.</p>
              <button className="btn-small" onClick={() => setEditing(true)}>
                <Icon name="plus" size={14} /> Adicionar exercícios
              </button>
            </div>
          )}

          {editing && (
            <button
              className="add-row"
              onClick={() =>
                setWorkout({ exercises: [...workout.exercises, { id: uid(), name: '', sets: 3, reps: '12', rest: '60s' }] })
              }
            >
              <span className="add-icon">
                <Icon name="plus" size={22} />
              </span>
              <span className="add-text">
                <strong>Adicionar exercício</strong>
              </span>
            </button>
          )}
        </section>

        {editing ? (
          <>
            <div className="detail-cta">
              <button className="btn-primary" onClick={toggleEditing}>
                Salvar treino <Icon name="check" size={18} />
              </button>
            </div>
            <button className="btn-ghost-danger" onClick={removeWorkout}>
              Excluir treino
            </button>
          </>
        ) : session ? (
          <>
            <div className="detail-cta">
              <button className="btn-primary" onClick={finish}>
                Concluir treino <Icon name="check" size={18} />
              </button>
            </div>
            <button className="btn-ghost-danger" onClick={cancel}>
              Cancelar treino
            </button>
          </>
        ) : workout.exercises.length > 0 ? (
          <div className="detail-cta">
            {doneToday && (
              <p className="done-note">
                <Icon name="check" size={15} strokeWidth={2.4} /> Concluído hoje
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

      <Sheet open={!!showing} onClose={() => setShowing(null)} title={showing?.name}>
        {showing && (
          <div className="ex-detail">
            {imageUrl(exerciseSlug(showing)) ? (
              <img className="ex-detail-img" src={imageUrl(exerciseSlug(showing))} alt={showing.name} />
            ) : (
              <div className="ex-detail-img ex-detail-empty">
                <Icon name="image" size={34} />
                <span>Ilustração em breve</span>
              </div>
            )}
            <div className="chips chips-center">
              <span className="chip">{showing.sets} séries</span>
              <span className="chip">{showing.reps} repetições</span>
              {showing.rest && <span className="chip">descanso {showing.rest}</span>}
            </div>
            {session && (
              <button
                className={checks.has(showing.id) ? 'btn-secondary' : 'btn-primary'}
                onClick={() => {
                  toggle(showing.id)
                  setShowing(null)
                }}
              >
                {checks.has(showing.id) ? 'Desmarcar' : 'Marcar como feito'} <Icon name="check" size={18} />
              </button>
            )}
          </div>
        )}
      </Sheet>
    </div>
  )
}
