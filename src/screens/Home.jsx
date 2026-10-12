import { useEffect, useState } from 'react'
import Icon from '../components/Icon'
import { Ring, Sheet, toast } from '../components/ui'
import { go } from '../lib/router'
import { WorkoutThumb } from './Workouts'
import { nextWorkout, useStore } from '../lib/store'
import { DOW_LETTERS, MONTHS, addDays, daysInMonth, fmtLong, monthKey, toKey, uid, weekDays } from '../lib/dates'

const MEASURE_FIELDS = [
  ['weight', 'Peso', 'kg'],
  ['waist', 'Cintura', 'cm'],
  ['hip', 'Quadril', 'cm'],
  ['thigh', 'Coxa', 'cm'],
  ['arm', 'Braço', 'cm'],
]

const minutesSince = (t) => Math.max(0, Math.round((Date.now() - t) / 60000))

export default function Home() {
  const { state } = useStore()
  const { profile, logs, measures, photos, workouts, session } = state
  const today = toKey()
  const [, tick] = useState(0)

  // Atualiza o tempo do treino em andamento
  useEffect(() => {
    if (!session) return
    const t = setInterval(() => tick((n) => n + 1), 30000)
    return () => clearInterval(t)
  }, [session])

  const trainedDays = new Set(logs.map((l) => l.date))
  const weekCount = weekDays().map(toKey).filter((k) => trainedDays.has(k)).length

  const doneToday = logs.find((l) => l.date === today)
  const sessionWorkout = session && workouts.find((w) => w.id === session.workoutId)
  const workout = sessionWorkout || nextWorkout(state)

  // Minha evolução (mês atual), sempre calculada a partir dos registros
  const mk = monthKey()
  const monthTrained = new Set(logs.filter((l) => l.date.startsWith(mk)).map((l) => l.date)).size
  const monthGoal = Math.max(1, Math.round((profile.weeklyGoal * daysInMonth()) / 7))
  const lastMeasure = [...measures].filter((m) => m.date.startsWith(mk)).sort((a, b) => a.date.localeCompare(b.date)).at(-1)
  const measuresFilled = lastMeasure ? MEASURE_FIELDS.filter(([f]) => lastMeasure[f] !== '' && lastMeasure[f] != null).length : 0
  const monthPhotos = photos.filter((p) => p.date.startsWith(mk)).length
  const photoGoal = Math.max(1, profile.photoGoal)

  return (
    <div className="home">
      <section className="greet-row">
        <div className="greet">
          <h1 className="serif greet-title">Oi, {profile.name || 'linda'}</h1>
          <p className="greet-sub">
            Disciplina hoje,
            <br />
            resultados amanhã.
          </p>
        </div>
        <div className="greet-side">
          <button className="icon-btn icon-btn-sm settings-btn" onClick={() => go('/perfil')} aria-label="Configurações">
            <Icon name="settings" size={20} />
          </button>
          <button className="streak" onClick={() => go('/treinos')} aria-label="Treinos da semana">
          <Icon name="flame" fill size={20} className="streak-flame" />
          <div className="streak-body">
            <div className="streak-num">
              {weekCount} / {profile.weeklyGoal}
            </div>
            <div className="streak-label">
              dias de treino
              <br />
              esta semana
            </div>
          </div>
          <Icon name="chevronRight" size={16} className="muted" />
          </button>
        </div>
      </section>

      {workout ? (
        <section className="card card-pink workout-card">
          <button className="workout-head" onClick={() => go('/treinos/' + workout.id)}>
            <WorkoutThumb workout={workout} size="lg" />
            <div className="workout-info">
              <div className="eyebrow">{sessionWorkout ? 'Treino em andamento' : doneToday ? 'Próximo treino' : 'Treino de hoje'}</div>
              <h2 className="serif card-title">{workout.name}</h2>
              <div className="workout-meta">
                {workout.focus && <>{workout.focus} · </>}
                {workout.exercises.length} {workout.exercises.length === 1 ? "exercício" : "exercícios"} · {workout.duration}
              </div>
            </div>
            <Icon name="chevronRight" size={18} className="muted" />
          </button>
          {sessionWorkout ? (
            <button className="btn-primary" onClick={() => go('/treinos/' + workout.id)}>
              Continuar treino · {minutesSince(session.startedAt)} min
              <Icon name="arrowRight" size={18} />
            </button>
          ) : (
            <>
              {doneToday && (
                <p className="done-note">
                  <Icon name="check" size={15} strokeWidth={2.4} /> Treino de hoje concluído. Arrasou!
                </p>
              )}
              <button className={doneToday ? 'btn-secondary' : 'btn-primary'} onClick={() => go('/treinos/' + workout.id + '?comecar')}>
                <Icon name="play" size={15} fill />
                Começar treino
              </button>
            </>
          )}
        </section>
      ) : (
        <section className="card card-pink empty-card">
          <div className="icon-tile">
            <Icon name="dumbbell" size={26} strokeWidth={2.2} />
          </div>
          <h2 className="serif card-title">Vamos começar?</h2>
          <p className="muted">Você ainda não tem nenhum treino. Monte o seu do jeito que preferir.</p>
          <button className="btn-primary" onClick={() => go('/treinos?novo')}>
            Montar meu primeiro treino <Icon name="arrowRight" size={18} />
          </button>
        </section>
      )}

      <section className="card">
        <button className="card-head" onClick={() => go('/perfil')}>
          <h2 className="card-head-title">Minha evolução</h2>
          <span className="card-head-aside">
            {MONTHS[new Date().getMonth()]} <Icon name="chevronRight" size={16} className="muted" />
          </span>
        </button>
        <div className="rings">
          <Ring value={monthTrained / monthGoal} label="Treinos" sub={`${monthTrained} de ${monthGoal}`} />
          <Ring value={measuresFilled / 5} label="Medidas" sub={`${measuresFilled} de 5`} />
          <Ring value={monthPhotos / photoGoal} label="Fotos" sub={`${monthPhotos} de ${photoGoal}`} />
        </div>
        {monthTrained + measuresFilled + monthPhotos === 0 && (
          <p className="hint">Conclua um treino, registre suas medidas ou adicione fotos para ver sua evolução do mês.</p>
        )}
      </section>

      <WeekCard />
    </div>
  )
}

function WeekCard() {
  const { state, update } = useStore()
  const { logs, restDays, measures, photos, workouts } = state
  const today = toKey()
  const [offset, setOffset] = useState(0)
  const [selected, setSelected] = useState(today)
  const [backfill, setBackfill] = useState(false)

  const days = weekDays(addDays(new Date(), offset * 7))
  const keys = days.map(toKey)
  const trained = new Set(logs.map((l) => l.date))
  const rest = new Set(restDays)

  const status = (k) => {
    if (trained.has(k)) return 'trained'
    if (rest.has(k)) return 'rest'
    return k < today ? 'empty' : 'future'
  }

  const shift = (n) => {
    const next = offset + n
    setOffset(next)
    setSelected(next === 0 ? today : toKey(weekDays(addDays(new Date(), next * 7))[0]))
  }

  const first = days[0]
  const last = days[6]
  const range =
    first.getMonth() === last.getMonth()
      ? `${first.getDate()}–${last.getDate()} ${MONTHS[first.getMonth()].slice(0, 3).toLowerCase()}`
      : `${first.getDate()} ${MONTHS[first.getMonth()].slice(0, 3).toLowerCase()} – ${last.getDate()} ${MONTHS[last.getMonth()].slice(0, 3).toLowerCase()}`

  const dayLogs = logs.filter((l) => l.date === selected)
  const dayMeasure = measures.find((m) => m.date === selected)
  const dayPhotos = photos.filter((p) => p.date === selected)
  const isRest = rest.has(selected)
  const nothing = !dayLogs.length && !dayMeasure && !dayPhotos.length && !isRest

  const toggleRest = () => {
    update((s) => ({
      restDays: isRest ? s.restDays.filter((d) => d !== selected) : [...s.restDays, selected],
    }))
    toast(isRest ? 'Descanso removido' : 'Dia marcado como descanso')
  }

  const removeLog = (log, name) => {
    if (!confirm(`Remover o registro de ${name} deste dia?`)) return
    update((s) => ({ logs: s.logs.filter((l) => l.id !== log.id) }))
    toast('Registro removido')
  }

  const addLog = (workoutId) => {
    update((s) => ({
      logs: [...s.logs, { id: uid(), date: selected, workoutId }],
      restDays: s.restDays.filter((d) => d !== selected),
    }))
    setBackfill(false)
    toast('Treino registrado ♥')
  }

  return (
    <section className="card">
      <div className="card-head">
        <h2 className="card-head-title">Minha semana</h2>
        <div className="week-nav">
          <button className="icon-btn icon-btn-sm" onClick={() => shift(-1)} aria-label="Semana anterior">
            <Icon name="chevronLeft" size={18} />
          </button>
          <span className="week-range">{offset === 0 ? 'Esta semana' : range}</span>
          <button className="icon-btn icon-btn-sm" onClick={() => shift(1)} aria-label="Próxima semana" disabled={offset >= 1}>
            <Icon name="chevronRight" size={18} />
          </button>
        </div>
      </div>

      <div className="week">
        {days.map((d, i) => {
          const k = keys[i]
          const st = status(k)
          return (
            <button
              key={k}
              className={'week-day' + (k === selected ? ' selected' : '')}
              onClick={() => setSelected(k)}
              aria-label={fmtLong(k)}
              aria-pressed={k === selected}
            >
              <span className="week-letter">{DOW_LETTERS[i]}</span>
              <span className={`week-num day-${st}` + (k === today ? ' day-today' : '')}>
                {st === 'rest' ? <Icon name="moon" size={14} /> : d.getDate()}
              </span>
              <span className={'week-today-dot' + (k === today ? ' on' : '')} />
            </button>
          )
        })}
      </div>

      <div className="legend">
        <span>
          <i className="lg lg-trained" /> Treino
        </span>
        <span>
          <i className="lg lg-rest" /> Descanso
        </span>
        <span>
          <i className="lg lg-empty" /> Sem registro
        </span>
      </div>

      <div className="day-panel">
        <div className="day-panel-title">{selected === today ? `Hoje · ${fmtLong(selected).split(', ')[1]}` : fmtLong(selected)}</div>

        {nothing && <p className="hint">{selected > today ? 'Dia ainda não chegou.' : 'Nada registrado neste dia.'}</p>}

        <ul className="day-items">
          {dayLogs.map((l) => {
            const w = workouts.find((x) => x.id === l.workoutId)
            const name = w ? `${w.name}${w.focus ? ' · ' + w.focus : ''}` : 'Treino removido'
            const details = [l.durationMin ? `${l.durationMin} min` : null, l.total ? `${l.completed}/${l.total} exercícios` : null].filter(Boolean)
            return (
              <li key={l.id}>
                <span className="day-icon">
                  <Icon name="dumbbell" size={16} strokeWidth={2} />
                </span>
                <span className="day-text">
                  <strong>{name}</strong>
                  {details.length > 0 && <small>{details.join(' · ')}</small>}
                </span>
                <button className="icon-btn icon-btn-sm" onClick={() => removeLog(l, w?.name || 'treino')} aria-label="Remover registro">
                  <Icon name="trash" size={15} />
                </button>
              </li>
            )
          })}
          {isRest && (
            <li>
              <span className="day-icon">
                <Icon name="moon" size={16} />
              </span>
              <span className="day-text">
                <strong>Dia de descanso</strong>
                <small>Recuperar também é treino.</small>
              </span>
            </li>
          )}
          {dayMeasure && (
            <li>
              <span className="day-icon">
                <Icon name="ruler" size={16} />
              </span>
              <span className="day-text">
                <strong>Medidas registradas</strong>
                <small>
                  {MEASURE_FIELDS.filter(([f]) => dayMeasure[f] !== '' && dayMeasure[f] != null)
                    .map(([f, label, unit]) => `${label} ${String(dayMeasure[f]).replace('.', ',')} ${unit}`)
                    .join(' · ')}
                </small>
              </span>
            </li>
          )}
          {dayPhotos.length > 0 && (
            <li>
              <span className="day-icon">
                <Icon name="image" size={16} />
              </span>
              <button className="day-text day-link" onClick={() => go('/fotos')}>
                <strong>
                  {dayPhotos.length} {dayPhotos.length === 1 ? 'foto' : 'fotos'}
                </strong>
                <small>{[...new Set(dayPhotos.map((p) => p.pose))].join(', ')}</small>
              </button>
            </li>
          )}
        </ul>

        <div className="day-actions">
          {selected <= today && workouts.length > 0 && (
            <button className="btn-small" onClick={() => setBackfill(true)}>
              <Icon name="plus" size={14} /> Registrar treino
            </button>
          )}
          {!dayLogs.length && (
            <button className="btn-small btn-small-soft" onClick={toggleRest}>
              <Icon name="moon" size={14} /> {isRest ? 'Remover descanso' : 'Marcar descanso'}
            </button>
          )}
        </div>
      </div>

      <Sheet open={backfill} onClose={() => setBackfill(false)} title="Qual treino você fez?">
        <p className="sheet-hint">{fmtLong(selected)}</p>
        <div className="sheet-actions">
          {workouts.map((w) => (
            <button key={w.id} className="sheet-action" onClick={() => addLog(w.id)}>
              {w.name}
              {w.focus && <span className="muted"> · {w.focus}</span>}
            </button>
          ))}
        </div>
      </Sheet>
    </section>
  )
}
