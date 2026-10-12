import { useEffect, useState } from 'react'
import Icon from '../components/Icon'
import Icon3D from '../components/Icon3D'
import { exerciseSlug, imageUrl } from '../lib/exerciseImages'
import { parseRest } from '../lib/progress'

export const elapsed = (t) => {
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000))
  const h = Math.floor(s / 3600)
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const sec = String(s % 60).padStart(2, '0')
  return h ? `${h}:${m}:${sec}` : `${m}:${sec}`
}

const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
const setsOf = (e) => Math.max(1, parseInt(e.sets, 10) || 1)
const fmtKg = (v) => (v === '' || v == null ? '' : String(v).replace('.', ','))

// Próximo exercício pendente depois do atual (dá a volta na lista)
export function nextPending(exercises, done, fromId) {
  const i = Math.max(0, exercises.findIndex((e) => e.id === fromId))
  for (let k = 1; k <= exercises.length; k++) {
    const e = exercises[(i + k) % exercises.length]
    if (!done.has(e.id) && e.id !== fromId) return e
  }
  return null
}

export function currentExercise(workout, session) {
  const done = new Set(session?.done || [])
  return (
    workout.exercises.find((e) => e.id === session?.current && !done.has(e.id)) || workout.exercises.find((e) => !done.has(e.id)) || null
  )
}

export default function Execution({ workout, session, update, onMinimize, onFinish, onShowList }) {
  const [, tick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  const exs = workout.exercises
  const done = new Set(session.done || [])
  const cur = currentExercise(workout, session)
  const curIndex = cur ? exs.indexOf(cur) : -1
  const sets = session.sets || {}
  const loads = session.loads || {}

  const setSession = (fn) => update((s) => (s.session ? { session: { ...s.session, ...fn(s.session) } } : {}))

  // ---------- Descanso ----------
  const rest = session.rest
  const remaining = rest ? Math.max(0, Math.ceil((rest.endsAt - Date.now()) / 1000)) : 0
  useEffect(() => {
    if (rest && remaining <= 0) {
      navigator.vibrate?.([80, 60, 80])
      setSession(() => ({ rest: null }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rest, remaining])

  const completeSet = () => {
    const total = setsOf(cur)
    const doneSets = Math.min(total, (sets[cur.id] || 0) + 1)
    const exerciseDone = doneSets >= total
    const nextDone = exerciseDone ? new Set([...done, cur.id]) : done
    const nextEx = exerciseDone ? nextPending(exs, nextDone, cur.id) : cur
    const restSec = parseRest(cur.rest)
    navigator.vibrate?.(25)
    setSession((ss) => ({
      sets: { ...(ss.sets || {}), [cur.id]: doneSets },
      done: [...nextDone],
      current: nextEx ? nextEx.id : null,
      rest: nextEx
        ? {
            endsAt: Date.now() + restSec * 1000,
            total: restSec,
            next: exerciseDone ? nextEx.name : `${cur.name} · série ${doneSets + 1} de ${total}`,
          }
        : null,
    }))
  }

  const skipExercise = () => {
    const nx = nextPending(exs, done, cur.id)
    if (nx) setSession(() => ({ current: nx.id, rest: null }))
  }

  const setLoad = (v) => setSession((ss) => ({ loads: { ...(ss.loads || {}), [cur.id]: v } }))
  const loadValue = loads[cur?.id] ?? cur?.load ?? ''
  const stepLoad = (d) => {
    const n = Math.max(0, Math.round(((parseFloat(String(loadValue).replace(',', '.')) || 0) + d) * 10) / 10)
    setLoad(n ? n : '')
  }

  const img = cur ? imageUrl(exerciseSlug(cur)) : null
  const setsDone = cur ? sets[cur.id] || 0 : 0
  const restPct = rest ? remaining / Math.max(1, rest.total) : 0
  const R = 104
  const C = 2 * Math.PI * R

  return (
    <div className="exec" role="dialog" aria-label={`Treino ${workout.name} em andamento`}>
      <div className="exec-top">
        <button className="icon-btn icon-btn-surface" onClick={onMinimize} aria-label="Minimizar treino">
          <Icon name="chevronLeft" size={22} />
        </button>
        <div className="exec-top-text">
          {cur ? `Exercício ${curIndex + 1} de ${exs.length}` : workout.name}
          <div className="exec-time">{elapsed(session.startedAt)}</div>
        </div>
        <button className="icon-btn icon-btn-surface" onClick={onShowList} aria-label="Ver todos os exercícios">
          <Icon name="more" size={22} strokeWidth={2.4} />
        </button>
      </div>

      <div className="exec-segments" aria-hidden="true">
        {exs.map((e) => (
          <i key={e.id} className={done.has(e.id) ? 'done' : e.id === cur?.id ? 'current' : ''} />
        ))}
      </div>

      {cur ? (
        <>
          <div className="exec-img">
            {img ? (
              <img key={img} src={img} alt={cur.name} />
            ) : (
              <div className="hero-empty">
                <Icon3D name="dumbbell" size={96} />
              </div>
            )}
          </div>

          <h1 className="exec-name">{cur.name}</h1>
          <div className="exec-sets" aria-label={`Série ${Math.min(setsDone + 1, setsOf(cur))} de ${setsOf(cur)}`}>
            {Array.from({ length: setsOf(cur) }, (_, i) => (
              <i key={i} className={i < setsDone ? 'on' : ''} />
            ))}
          </div>

          {cur.rest && (
            <p className="exec-rest-note">
              <Icon name="clock" size={14} /> Descanso de {cur.rest} entre as séries
            </p>
          )}

          <div className="exec-facts">
            <div className="exec-fact">
              <strong>
                {Math.min(setsDone + 1, setsOf(cur))}/{setsOf(cur)}
              </strong>
              <span>Série</span>
            </div>
            <div className="exec-fact">
              <strong>{cur.reps}</strong>
              <span>Repetições</span>
            </div>
            <div className="exec-fact">
              <div className="load-ctrl">
                <button onClick={() => stepLoad(-2.5)} aria-label="Diminuir carga">
                  <Icon name="minus" size={14} />
                </button>
                <strong>{fmtKg(loadValue) || '—'}</strong>
                <button onClick={() => stepLoad(2.5)} aria-label="Aumentar carga">
                  <Icon name="plus" size={14} />
                </button>
              </div>
              <span>Carga (kg)</span>
            </div>
          </div>

          <div className="exec-actions">
            <button className="btn btn-primary btn-lg btn-block btn-cta" onClick={completeSet}>
              <Icon name="check" size={18} strokeWidth={2.6} /> Concluir série
            </button>
            <button className="btn btn-ghost" onClick={skipExercise} disabled={!nextPending(exs, done, cur.id)}>
              Próximo exercício <Icon name="arrowRight" size={16} />
            </button>
          </div>
        </>
      ) : (
        <div className="empty" style={{ flex: 1, justifyContent: 'center' }}>
          <Icon3D name="trophy" size={96} />
          <p className="empty-title">Todos os exercícios feitos!</p>
          <p className="empty-text">Tempo de treino: {elapsed(session.startedAt)}. Finalize para registrar o treino.</p>
          <div className="stack-sm" style={{ width: '100%', marginTop: 12 }}>
            <button className="btn btn-primary btn-lg btn-block btn-cta" onClick={onFinish}>
              Concluir treino
            </button>
            <button className="btn btn-ghost" onClick={onShowList}>
              Revisar exercícios
            </button>
          </div>
        </div>
      )}

      {rest && remaining > 0 && (
        <div className="rest" role="timer" aria-live="polite">
          <span className="rest-label">DESCANSO</span>
          <div className="rest-ring">
            <svg viewBox="0 0 240 240">
              <defs>
                <linearGradient id="restGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#8A6BFF" />
                  <stop offset="1" stopColor="#FF6F5B" />
                </linearGradient>
              </defs>
              <circle cx="120" cy="120" r={R} className="ring-track" />
              <circle cx="120" cy="120" r={R} className="ring-bar" strokeDasharray={C} strokeDashoffset={C * (1 - restPct)} />
            </svg>
            <div className="rest-time">{mmss(remaining)}</div>
          </div>
          <p className="rest-next">
            Próximo
            <strong>{rest.next}</strong>
          </p>
          <div className="rest-actions">
            <button
              className="btn btn-outline btn-lg"
              onClick={() => setSession((ss) => ({ rest: { ...ss.rest, endsAt: ss.rest.endsAt + 15000, total: ss.rest.total + 15 } }))}
            >
              +15s
            </button>
            <button className="btn btn-primary btn-lg" onClick={() => setSession(() => ({ rest: null }))}>
              Pular descanso
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
