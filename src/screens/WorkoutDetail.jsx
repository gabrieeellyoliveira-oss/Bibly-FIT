import { useEffect, useState } from 'react'
import Icon from '../components/Icon'
import Icon3D from '../components/Icon3D'
import Celebration from '../components/Celebration'
import { Empty, PageHeader, SectionHead, Sheet, toast } from '../components/ui'
import Execution, { currentExercise } from './Execution'
import { go } from '../lib/router'
import { useStore } from '../lib/store'
import { fmtBR, toKey, uid } from '../lib/dates'
import { exerciseSlug, imageUrl, workoutAccent, workoutCover } from '../lib/exerciseImages'

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`

export default function WorkoutDetail({ id, query }) {
  const { state, update } = useStore()
  const workout = state.workouts.find((w) => w.id === id)
  const session = state.session?.workoutId === id ? state.session : null
  const otherSession = state.session && !session ? state.workouts.find((w) => w.id === state.session.workoutId) : null
  const [editing, setEditing] = useState(false)
  const [showing, setShowing] = useState(null)
  const [listOpen, setListOpen] = useState(false)
  const [celebrate, setCelebrate] = useState(null)
  const [focus, setFocus] = useState(!!session)
  const today = toKey()
  const doneToday = state.logs.find((l) => l.date === today && l.workoutId === id)

  // Vindo do botão "Começar treino" da tela inicial
  useEffect(() => {
    if (query === 'comecar' && workout && !session) start()
    if (query) history.replaceState(null, '', '#/treinos/' + encodeURIComponent(id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!workout) {
    return (
      <div className="stack">
        <PageHeader title="Treino" onBack={() => go('/treinos')} />
        <Empty icon="dumbbell" title="Esse treino não existe mais" text="Ele pode ter sido excluído." action="Ver meus treinos" onAction={() => go('/treinos')} />
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
    update(() => ({
      session: { workoutId: id, startedAt: Date.now(), done: [], sets: {}, loads: {}, current: workout.exercises[0].id, rest: null },
    }))
    setFocus(true)
    toast('Bom treino!')
  }

  const finish = () => {
    const done = new Set(session.done || [])
    const completed = workout.exercises.filter((e) => done.has(e.id)).length
    if (completed === 0 && !confirm('Nenhum exercício concluído. Finalizar o treino mesmo assim?')) return
    const durationMin = Math.max(1, Math.round((Date.now() - session.startedAt) / 60000))
    const usedLoads = session.loads || {}
    const loadsByName = Object.fromEntries(
      workout.exercises.filter((e) => usedLoads[e.id] !== undefined && usedLoads[e.id] !== '').map((e) => [e.name, usedLoads[e.id]]),
    )
    update((s) => ({
      session: null,
      restDays: s.restDays.filter((d) => d !== today),
      // guarda a última carga usada em cada exercício para a próxima vez
      workouts: s.workouts.map((w) =>
        w.id === id
          ? { ...w, exercises: w.exercises.map((e) => (usedLoads[e.id] !== undefined ? { ...e, load: usedLoads[e.id] } : e)) }
          : w,
      ),
      logs: [
        ...s.logs,
        { id: uid(), date: today, workoutId: id, startedAt: session.startedAt, durationMin, completed, total: workout.exercises.length, loads: loadsByName },
      ],
    }))
    setFocus(false)
    setListOpen(false)
    setCelebrate({ durationMin, completed, total: workout.exercises.length })
  }

  const cancel = () => {
    if (!confirm('Cancelar este treino? O progresso desta sessão não será salvo.')) return
    update(() => ({ session: null }))
    setFocus(false)
    setListOpen(false)
    toast('Treino cancelado')
  }

  const undoToday = () => {
    if (!confirm('Remover o registro do treino de hoje?')) return
    update((s) => ({ logs: s.logs.filter((l) => l.id !== doneToday.id) }))
    toast('Registro de hoje removido')
  }

  const setWorkout = (patch) => update((s) => ({ workouts: s.workouts.map((w) => (w.id === id ? { ...w, ...patch } : w)) }))
  const setExercise = (exId, patch) => setWorkout({ exercises: workout.exercises.map((e) => (e.id === exId ? { ...e, ...patch } : e)) })

  const removeExercise = (e) => {
    if (!confirm(`Remover “${e.name || 'exercício sem nome'}” do treino?`)) return
    setWorkout({ exercises: workout.exercises.filter((x) => x.id !== e.id) })
    if (session) update((s) => ({ session: { ...s.session, done: (s.session.done || []).filter((d) => d !== e.id) } }))
    toast('Exercício removido')
  }

  const toggleEditing = () => {
    if (editing) {
      if (workout.exercises.some((e) => !e.name.trim())) setWorkout({ exercises: workout.exercises.filter((e) => e.name.trim()) })
      toast('Treino salvo')
    }
    setEditing(!editing)
  }

  const removeWorkout = () => {
    if (!confirm(`Excluir ${workout.name}? Os registros de treinos feitos continuam no histórico.`)) return
    update((s) => ({ workouts: s.workouts.filter((w) => w.id !== id), session: s.session?.workoutId === id ? null : s.session }))
    toast('Treino excluído')
    go('/treinos')
  }

  const jumpTo = (exId) => {
    update((s) => ({ session: { ...s.session, current: exId, rest: null } }))
    setListOpen(false)
    setShowing(null)
    setFocus(true)
  }

  const done = new Set(session?.done || [])
  const current = session ? currentExercise(workout, session) : null
  const doneCount = workout.exercises.filter((e) => done.has(e.id)).length
  const cover = imageUrl(workoutCover(workout))
  const totalSets = workout.exercises.reduce((n, e) => n + (parseInt(e.sets, 10) || 0), 0)
  const accent = workoutAccent(workout)
  const lastLog = [...state.logs]
    .filter((l) => l.workoutId === id)
    .sort((a, b) => a.date.localeCompare(b.date))
    .at(-1)

  const exStatus = (e) => {
    if (!session) return null
    if (done.has(e.id)) return 'done'
    if (current?.id === e.id) return 'current'
    return 'pending'
  }

  const exerciseRow = (e, i, onClick) => {
    const st = exStatus(e)
    const thumb = imageUrl(exerciseSlug(e), true)
    const setsDone = session?.sets?.[e.id] || 0
    return (
      <li key={e.id}>
        <button className={'ex-item card-press' + (st === 'done' ? ' done' : '')} onClick={onClick}>
          <span className="ex-thumb">{thumb ? <img src={thumb} alt="" loading="lazy" /> : i + 1}</span>
          <span className="ex-text">
            <span className="ex-name">{e.name}</span>
            <span className="ex-meta">
              <span>
                {e.sets} séries × {e.reps}
              </span>
              {e.rest && (
                <span>
                  <Icon name="clock" size={12} /> {e.rest}
                </span>
              )}
              {e.load !== undefined && e.load !== '' && <span>{String(e.load).replace('.', ',')} kg</span>}
            </span>
          </span>
          <span className="ex-status">
            {st === 'done' ? (
              <Icon3D name="check" size={30} title="Concluído" />
            ) : st === 'current' ? (
              <span className="badge badge-live">Agora</span>
            ) : st === 'pending' && setsDone > 0 ? (
              <span className="badge badge-primary">
                {setsDone}/{e.sets}
              </span>
            ) : (
              <Icon name="chevronRight" size={18} className="row-chevron" />
            )}
          </span>
        </button>
      </li>
    )
  }

  return (
    <div className={'accent-' + accent}>
      <div className="detail-hero">
        {cover ? (
          <img src={cover} alt="" />
        ) : (
          <div className="hero-empty">
            <Icon3D name="dumbbell" size={110} />
          </div>
        )}
        <div className="hero-actions">
          <button className="icon-btn icon-btn-surface" onClick={() => go('/treinos')} aria-label="Voltar">
            <Icon name="chevronLeft" size={22} />
          </button>
          <button className="icon-btn icon-btn-surface" onClick={toggleEditing} aria-label={editing ? 'Salvar edição' : 'Editar treino'}>
            <Icon name={editing ? 'check' : 'edit'} size={19} />
          </button>
        </div>
      </div>

      <div className="detail-sheet">
        <div className="stack-sm">
          <div className="chips">
            {workout.focus && <span className="badge badge-primary">{workout.focus}</span>}
            {session && <span className="badge badge-live">Em andamento</span>}
            {!session && doneToday && <span className="badge badge-done">✓ Feito hoje</span>}
          </div>
          <h1 className="detail-title">{workout.name}</h1>
        </div>

        <div className="stats">
          <div className="stat">
            <Icon3D name="dumbbell" size={30} />
            <strong>{workout.exercises.length}</strong>
            <span>{workout.exercises.length === 1 ? 'exercício' : 'exercícios'}</span>
          </div>
          <div className="stat">
            <Icon3D name="timer" size={30} />
            <strong>{workout.duration || '—'}</strong>
            <span>duração</span>
          </div>
          <div className="stat">
            <Icon3D name="flame" size={30} />
            <strong>{totalSets}</strong>
            <span>séries</span>
          </div>
        </div>

        {session ? (
          <div className="progress-card">
            <div className="row-between">
              <span>Progresso do treino</span>
              <span>
                {doneCount}/{workout.exercises.length}
              </span>
            </div>
            <div className="progress">
              <span style={{ width: `${(doneCount / Math.max(1, workout.exercises.length)) * 100}%` }} />
            </div>
          </div>
        ) : (
          lastLog && (
            <p className="hint">
              Último treino em {fmtBR(lastLog.date)}
              {lastLog.durationMin ? ` · ${lastLog.durationMin} min` : ''}
              {lastLog.total ? ` · ${lastLog.completed}/${lastLog.total} exercícios` : ''}
            </p>
          )
        )}

        {otherSession && (
          <p className="alert alert-info">
            O {otherSession.name} está em andamento.{' '}
            <button className="link" onClick={() => go('/treinos/' + state.session.workoutId)}>
              Voltar para ele
            </button>
          </p>
        )}

        {editing && (
          <section className="card form">
            <div className="form-grid">
              <label className="field">
                Categoria
                <input className="input" value={workout.focus} onChange={(e) => setWorkout({ focus: e.target.value })} />
              </label>
              <label className="field">
                Duração
                <input className="input" value={workout.duration} onChange={(e) => setWorkout({ duration: e.target.value })} />
              </label>
            </div>
          </section>
        )}

        <section>
          <SectionHead title="Exercícios" />
          {workout.exercises.length === 0 && !editing ? (
            <div className="card">
              <Empty
                icon="dumbbell"
                title="Nenhum exercício ainda"
                text="Adicione os exercícios deste treino para começar."
                action="Adicionar exercícios"
                onAction={() => setEditing(true)}
              />
            </div>
          ) : (
            <ul className="ex-list">
              {workout.exercises.map((e, i) =>
                editing ? (
                  <li key={e.id} className="card ex-edit">
                    <label className="field">
                      Exercício
                      <input className="input" value={e.name} onChange={(ev) => setExercise(e.id, { name: ev.target.value })} placeholder="Nome do exercício" />
                    </label>
                    <div className="form-grid form-grid-3">
                      <label className="field">
                        Séries
                        <input className="input" inputMode="numeric" value={e.sets} onChange={(ev) => setExercise(e.id, { sets: ev.target.value })} />
                      </label>
                      <label className="field">
                        Reps
                        <input className="input" value={e.reps} onChange={(ev) => setExercise(e.id, { reps: ev.target.value })} />
                      </label>
                      <label className="field">
                        Descanso
                        <input className="input" value={e.rest} onChange={(ev) => setExercise(e.id, { rest: ev.target.value })} />
                      </label>
                    </div>
                    <button className="btn btn-danger" onClick={() => removeExercise(e)} style={{ alignSelf: 'flex-start' }}>
                      <Icon name="trash" size={16} /> Remover exercício
                    </button>
                  </li>
                ) : (
                  exerciseRow(e, i, () => setShowing(e))
                ),
              )}
            </ul>
          )}

          {editing && (
            <button
              className="add-card"
              style={{ marginTop: 12 }}
              onClick={() => setWorkout({ exercises: [...workout.exercises, { id: uid(), name: '', sets: 3, reps: '12', rest: '60s' }] })}
            >
              <Icon3D name="sparkle" size={38} />
              <span className="row-text">
                <strong>Adicionar exercício</strong>
              </span>
              <Icon name="plus" size={20} className="row-chevron" />
            </button>
          )}
        </section>

        <div className="detail-cta">
          {editing ? (
            <button className="btn btn-primary btn-lg btn-block" onClick={toggleEditing}>
              Salvar treino
            </button>
          ) : session ? (
            <button className="btn btn-primary btn-lg btn-block btn-cta" onClick={() => setFocus(true)}>
              <Icon name="play" size={16} fill /> Continuar treino
            </button>
          ) : workout.exercises.length > 0 ? (
            <button className={'btn btn-lg btn-block btn-cta ' + (doneToday ? 'btn-secondary' : 'btn-primary')} onClick={start}>
              <Icon name="play" size={16} fill /> {doneToday ? 'Treinar de novo' : 'Começar treino'}
            </button>
          ) : null}
        </div>

        <div className="stack-sm" style={{ alignItems: 'center', paddingBottom: 8 }}>
          {editing && (
            <button className="btn btn-danger" onClick={removeWorkout}>
              Excluir treino
            </button>
          )}
          {!editing && session && (
            <button className="btn btn-danger" onClick={cancel}>
              Cancelar treino
            </button>
          )}
          {!editing && !session && doneToday && (
            <button className="btn btn-ghost" onClick={undoToday}>
              Desfazer registro de hoje
            </button>
          )}
        </div>
      </div>

      {session && focus && (
        <Execution workout={workout} session={session} update={update} onMinimize={() => setFocus(false)} onFinish={finish} onShowList={() => setListOpen(true)} />
      )}

      <Sheet open={listOpen} onClose={() => setListOpen(false)} title="Exercícios do treino">
        <ul className="ex-list">{workout.exercises.map((e, i) => exerciseRow(e, i, () => jumpTo(e.id)))}</ul>
        <div className="stack-sm" style={{ marginTop: 16 }}>
          <button className="btn btn-primary btn-block" onClick={finish}>
            Finalizar treino agora
          </button>
          <button className="btn btn-danger" onClick={cancel} style={{ alignSelf: 'center' }}>
            Cancelar treino
          </button>
        </div>
      </Sheet>

      <Sheet open={!!showing} onClose={() => setShowing(null)} title={showing?.name}>
        {showing && (
          <div className="ex-detail">
            {imageUrl(exerciseSlug(showing)) ? (
              <img className="ex-detail-img" src={imageUrl(exerciseSlug(showing))} alt={showing.name} />
            ) : (
              <div className="ex-detail-empty">
                <Icon3D name="photo" size={56} />
                Ilustração em breve
              </div>
            )}
            <div className="chips" style={{ justifyContent: 'center' }}>
              <span className="chip">{showing.sets} séries</span>
              <span className="chip">{showing.reps} repetições</span>
              {showing.rest && <span className="chip">descanso {showing.rest}</span>}
              {showing.load !== undefined && showing.load !== '' && <span className="chip">{String(showing.load).replace('.', ',')} kg</span>}
            </div>
            {session && !done.has(showing.id) && (
              <button className="btn btn-primary btn-lg btn-block" onClick={() => jumpTo(showing.id)}>
                Fazer este exercício agora
              </button>
            )}
          </div>
        )}
      </Sheet>

      {celebrate && (
        <Celebration
          name={state.profile.name}
          workoutName={workout.name}
          {...celebrate}
          onClose={() => {
            setCelebrate(null)
            go('/')
          }}
        />
      )}
    </div>
  )
}
