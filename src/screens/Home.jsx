import { useEffect, useState } from 'react'
import Icon from '../components/Icon'
import Icon3D from '../components/Icon3D'
import { Ring, SectionHead, Sheet, toast } from '../components/ui'
import { go } from '../lib/router'
import { nextWorkout, useStore } from '../lib/store'
import { imageUrl, workoutCover } from '../lib/exerciseImages'
import { achievements } from '../lib/progress'
import { DOW_LETTERS, MONTHS, addDays, daysInMonth, fmtLong, monthKey, toKey, uid, weekDays } from '../lib/dates'

const MEASURE_FIELDS = [
  ['weight', 'Peso', 'kg'],
  ['waist', 'Cintura', 'cm'],
  ['hip', 'Quadril', 'cm'],
  ['thigh', 'Coxa', 'cm'],
  ['arm', 'Braço', 'cm'],
]

const minutesSince = (t) => Math.max(0, Math.round((Date.now() - t) / 60000))
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`

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
  const weekKeys = weekDays().map(toKey)
  const weekCount = weekKeys.filter((k) => trainedDays.has(k)).length
  const goal = profile.weeklyGoal

  const doneToday = logs.find((l) => l.date === today)
  const sessionWorkout = session && workouts.find((w) => w.id === session.workoutId)
  const workout = sessionWorkout || nextWorkout(state)
  const cover = workout && imageUrl(workoutCover(workout), true)

  // Minha evolução (mês atual), calculada a partir dos registros
  const mk = monthKey()
  const monthTrained = new Set(logs.filter((l) => l.date.startsWith(mk)).map((l) => l.date)).size
  const monthGoal = Math.max(1, Math.round((goal * daysInMonth()) / 7))
  const lastMeasure = [...measures].filter((m) => m.date.startsWith(mk)).sort((a, b) => a.date.localeCompare(b.date)).at(-1)
  const measuresFilled = lastMeasure ? MEASURE_FIELDS.filter(([f]) => lastMeasure[f] !== '' && lastMeasure[f] != null).length : 0
  const monthPhotos = photos.filter((p) => p.date.startsWith(mk)).length
  const photoGoal = Math.max(1, profile.photoGoal)

  const { list: achv, streak } = achievements(state)
  const lastAchv = achv.filter((a) => a.unlocked).at(-1)

  return (
    <div className="stack">
      <header className="home-top">
        <div>
          <h1 className="greet-title">Oi, {profile.name || 'linda'}</h1>
          <p className="greet-sub">
            Disciplina hoje,
            <br />
            resultados amanhã.
          </p>
        </div>
        <button className="avatar-btn" onClick={() => go('/perfil')} aria-label="Abrir perfil">
          {(profile.name || 'B').slice(0, 1).toUpperCase()}
        </button>
      </header>

      <section className="stat-strip">
        <button className="week-goal card-press" onClick={() => go('/treinos')} aria-label="Treinos da semana">
          <Icon3D name="calendar" size={38} />
          <div>
            <div className="week-goal-num">
              {weekCount} <small>/ {goal}</small>
            </div>
            <div className="week-goal-label">dias de treino esta semana</div>
            <div className="week-dots" aria-hidden="true">
              {Array.from({ length: goal }, (_, i) => (
                <i key={i} className={i < weekCount ? 'on' : ''} />
              ))}
            </div>
          </div>
        </button>
        <div className="streak-pill" aria-label={`${streak} dias seguidos`}>
          <Icon3D name="flame" size={30} />
          <strong>{streak}</strong>
          <span>{streak === 1 ? 'dia seguido' : 'dias seguidos'}</span>
        </div>
      </section>

      {workout ? (
        <section className="today">
          <button className="today-main" onClick={() => go('/treinos/' + workout.id)}>
            <div className="today-info">
              <span className="eyebrow">{sessionWorkout ? 'Treino em andamento' : doneToday ? 'Próximo treino' : 'Treino de hoje'}</span>
              <h2 className="today-title">{workout.name}</h2>
              <div className="today-meta">
                {workout.focus && <span>{workout.focus}</span>}
                <span>
                  <Icon name="dumbbell" size={14} /> {plural(workout.exercises.length, 'exercício', 'exercícios')}
                </span>
                {workout.duration && (
                  <span>
                    <Icon name="clock" size={14} /> {workout.duration}
                  </span>
                )}
              </div>
            </div>
            <div className="today-img">{cover ? <img src={cover} alt="" /> : null}</div>
          </button>

          {doneToday && !sessionWorkout && (
            <p className="today-done">
              <Icon3D name="check" size={22} /> Treino de hoje concluído. Arrasou!
            </p>
          )}

          {sessionWorkout ? (
            <button className="btn btn-primary btn-lg btn-block btn-cta" onClick={() => go('/treinos/' + workout.id)}>
              <Icon name="play" size={16} fill /> Continuar treino · {minutesSince(session.startedAt)} min
            </button>
          ) : (
            <button
              className={'btn btn-lg btn-block btn-cta ' + (doneToday ? 'btn-secondary' : 'btn-primary')}
              onClick={() => go('/treinos/' + workout.id + '?comecar')}
            >
              <Icon name="play" size={16} fill /> Começar treino
            </button>
          )}
        </section>
      ) : (
        <section className="today">
          <div className="empty" style={{ padding: 0 }}>
            <Icon3D name="dumbbell" size={72} />
            <p className="empty-title">Hoje começa a sua rotina</p>
            <p className="empty-text">Você ainda não tem treinos. Monte o seu ou comece com os sugeridos.</p>
          </div>
          <button className="btn btn-primary btn-lg btn-block btn-cta" onClick={() => go('/treinos?novo')}>
            Montar meu primeiro treino
          </button>
        </section>
      )}

      <section className="card">
        <SectionHead title="Minha evolução" action={MONTHS[new Date().getMonth()]} onAction={() => go('/evolucao')} />
        <div className="metrics">
          <button className="metric" onClick={() => go('/evolucao')}>
            <Ring value={monthTrained / monthGoal} color="primary" />
            <span className="metric-label">Treinos</span>
            <span className="metric-sub">
              {monthTrained} de {monthGoal}
            </span>
          </button>
          <button className="metric" onClick={() => go('/evolucao')}>
            <Ring value={measuresFilled / 5} color="coral" />
            <span className="metric-label">Medidas</span>
            <span className="metric-sub">{measuresFilled} de 5</span>
          </button>
          <button className="metric" onClick={() => go('/fotos')}>
            <Ring value={monthPhotos / photoGoal} color="peach" />
            <span className="metric-label">Fotos</span>
            <span className="metric-sub">
              {monthPhotos} de {photoGoal}
            </span>
          </button>
        </div>
        {monthTrained + measuresFilled + monthPhotos === 0 && (
          <p className="hint" style={{ marginTop: 12 }}>
            Conclua um treino, registre medidas ou adicione fotos para ver sua evolução do mês.
          </p>
        )}
      </section>

      {lastAchv && (
        <button className="achv-banner card-press" onClick={() => go('/evolucao')}>
          <Icon3D name={lastAchv.icon} size={40} />
          <span className="row-text">
            <strong>{lastAchv.title}</strong>
            <small>{lastAchv.desc}</small>
          </span>
          <Icon name="chevronRight" size={18} className="row-chevron" />
        </button>
      )}

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
  const statusLabel = { trained: 'treino feito', rest: 'descanso', empty: 'sem registro', future: '' }

  const shift = (n) => {
    const next = offset + n
    setOffset(next)
    setSelected(next === 0 ? today : toKey(weekDays(addDays(new Date(), next * 7))[0]))
  }

  const mon = (d) => MONTHS[d.getMonth()].slice(0, 3).toLowerCase()
  const range =
    days[0].getMonth() === days[6].getMonth()
      ? `${days[0].getDate()}–${days[6].getDate()} ${mon(days[0])}`
      : `${days[0].getDate()} ${mon(days[0])} – ${days[6].getDate()} ${mon(days[6])}`

  const dayLogs = logs.filter((l) => l.date === selected)
  const dayMeasure = measures.find((m) => m.date === selected)
  const dayPhotos = photos.filter((p) => p.date === selected)
  const isRest = rest.has(selected)
  const nothing = !dayLogs.length && !dayMeasure && !dayPhotos.length && !isRest

  const toggleRest = () => {
    update((s) => ({ restDays: isRest ? s.restDays.filter((d) => d !== selected) : [...s.restDays, selected] }))
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
    toast('Treino registrado')
  }

  return (
    <section className="card">
      <div className="section-head">
        <h2 className="section-title">Minha semana</h2>
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
              aria-label={`${fmtLong(k)}${statusLabel[st] ? ', ' + statusLabel[st] : ''}`}
              aria-pressed={k === selected}
            >
              <span className="week-letter">{DOW_LETTERS[i]}</span>
              <span className={`week-num day-${st}` + (k === today ? ' day-today' : '')}>
                {st === 'rest' ? <Icon name="moon" size={15} /> : st === 'trained' ? <Icon name="check" size={16} strokeWidth={3} /> : d.getDate()}
              </span>
              <span className={'week-mark' + (k === today ? ' today' : '')}>{k === today ? 'hoje' : d.getDate()}</span>
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

        {nothing && (
          <p className="hint" style={{ marginTop: 6 }}>
            {selected > today ? 'Esse dia ainda não chegou.' : 'Nada registrado neste dia.'}
          </p>
        )}

        <ul className="day-items">
          {dayLogs.map((l) => {
            const w = workouts.find((x) => x.id === l.workoutId)
            const name = w ? w.name : 'Treino removido'
            const details = [w?.focus, l.durationMin ? `${l.durationMin} min` : null, l.total ? `${l.completed}/${l.total} exercícios` : null].filter(Boolean)
            return (
              <li key={l.id}>
                <Icon3D name="dumbbell" size={36} />
                <span className="row-text">
                  <strong>{name}</strong>
                  {details.length > 0 && <small>{details.join(' · ')}</small>}
                </span>
                <button className="icon-btn icon-btn-sm" onClick={() => removeLog(l, name)} aria-label="Remover registro">
                  <Icon name="trash" size={16} />
                </button>
              </li>
            )
          })}
          {isRest && (
            <li>
              <Icon3D name="moon" size={36} />
              <span className="row-text">
                <strong>Dia de descanso</strong>
                <small>Recuperar também é treino.</small>
              </span>
            </li>
          )}
          {dayMeasure && (
            <li>
              <Icon3D name="tape" size={36} />
              <span className="row-text">
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
              <Icon3D name="camera" size={36} />
              <button className="row-text" style={{ textAlign: 'left' }} onClick={() => go('/fotos')}>
                <strong>{plural(dayPhotos.length, 'foto', 'fotos')}</strong>
                <small>{[...new Set(dayPhotos.map((p) => p.pose))].join(', ')}</small>
              </button>
            </li>
          )}
        </ul>

        <div className="day-actions">
          {selected <= today && workouts.length > 0 && (
            <button className="btn btn-secondary btn-sm" onClick={() => setBackfill(true)}>
              <Icon name="plus" size={15} /> Registrar treino
            </button>
          )}
          {!dayLogs.length && (
            <button className="btn btn-outline btn-sm" onClick={toggleRest}>
              <Icon name="moon" size={15} /> {isRest ? 'Remover descanso' : 'Marcar descanso'}
            </button>
          )}
        </div>
      </div>

      <Sheet open={backfill} onClose={() => setBackfill(false)} title="Qual treino você fez?">
        <p className="sheet-hint" style={{ marginBottom: 12 }}>
          {fmtLong(selected)}
        </p>
        <div className="sheet-actions">
          {workouts.map((w) => (
            <button key={w.id} className="sheet-action" onClick={() => addLog(w.id)}>
              <Icon3D name="dumbbell" size={30} />
              <span className="row-text">
                <span className="row-title">{w.name}</span>
                {w.focus && <span className="row-sub">{w.focus}</span>}
              </span>
            </button>
          ))}
        </div>
      </Sheet>
    </section>
  )
}
