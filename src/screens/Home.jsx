import Icon from '../components/Icon'
import { Ring } from '../components/ui'
import { go } from '../lib/router'
import { nextWorkout, useStore } from '../lib/store'
import { DOW_LETTERS, daysInMonth, monthKey, toKey, weekDays } from '../lib/dates'

const MEASURE_FIELDS = ['weight', 'waist', 'hip', 'thigh', 'arm']

export default function Home() {
  const { state } = useStore()
  const { profile, logs, measures, photos } = state
  const today = toKey()
  const days = weekDays()
  const weekKeys = days.map(toKey)
  const trainedDays = new Set(logs.map((l) => l.date))
  const weekCount = weekKeys.filter((k) => trainedDays.has(k)).length

  const doneToday = logs.find((l) => l.date === today)
  const workout = doneToday
    ? state.workouts.find((w) => w.id === doneToday.workoutId) || nextWorkout(state)
    : nextWorkout(state)

  // Minha evolução (mês atual)
  const mk = monthKey()
  const monthTrained = new Set(logs.filter((l) => l.date.startsWith(mk)).map((l) => l.date)).size
  const monthGoal = Math.max(1, Math.round((profile.weeklyGoal * daysInMonth()) / 7))
  const lastMeasure = [...measures].filter((m) => m.date.startsWith(mk)).sort((a, b) => a.date.localeCompare(b.date)).at(-1)
  const measuresFilled = lastMeasure ? MEASURE_FIELDS.filter((f) => lastMeasure[f]).length : 0
  const monthPhotos = photos.filter((p) => p.date.startsWith(mk)).length
  const photoGoal = Math.max(1, profile.photoGoal)

  return (
    <div className="home">
      <header className="brand-row">
        <div>
          <div className="brand">bibly</div>
          <div className="brand-tag">YOUR PERSONAL WELLNESS SPACE</div>
        </div>
        <button className="icon-btn" onClick={() => go('/perfil')} aria-label="Configurações">
          <Icon name="settings" size={24} />
        </button>
      </header>

      <section className="greet-row">
        <div className="greet">
          <h1 className="serif greet-title">
            Oi, {profile.name || 'linda'}
          </h1>
          <p className="greet-sub">
            Disciplina hoje,
            <br />
            resultados amanhã.
          </p>
        </div>
        <button className="streak" onClick={() => go('/treinos')}>
          <Icon name="flame" fill size={22} className="streak-flame" />
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
          <Icon name="chevronRight" size={18} className="muted" />
        </button>
      </section>

      {workout && (
        <section className="card card-pink workout-card">
          <button className="workout-head" onClick={() => go('/treinos/' + workout.id)}>
            <div className="icon-tile">
              <Icon name="dumbbell" size={28} strokeWidth={2.4} />
            </div>
            <div className="workout-info">
              <h2 className="serif card-title">Meu treino</h2>
              <div className="workout-name">
                {workout.name} · {workout.focus}
              </div>
              <div className="workout-meta">
                {workout.exercises.length} exercícios · {workout.duration}
              </div>
            </div>
            <Icon name="chevronRight" size={18} className="muted" />
          </button>
          <button className="btn-primary" onClick={() => go('/treinos/' + workout.id)}>
            {doneToday ? 'Treino de hoje concluído' : 'Ver treino'}
            <Icon name={doneToday ? 'check' : 'arrowRight'} size={18} />
          </button>
        </section>
      )}

      <section className="card">
        <button className="card-head" onClick={() => go('/perfil')}>
          <h2 className="card-head-title">Minha evolução</h2>
          <Icon name="chevronRight" size={18} className="muted" />
        </button>
        <div className="rings">
          <Ring value={monthTrained / monthGoal} label="Treinos" sub={`${monthTrained} de ${monthGoal}`} />
          <Ring value={measuresFilled / 5} label="Medidas" sub={`${measuresFilled} de 5`} />
          <Ring value={monthPhotos / photoGoal} label="Fotos" sub={`${monthPhotos} de ${photoGoal}`} />
        </div>
      </section>

      <section className="card">
        <button className="card-head" onClick={() => go('/treinos')}>
          <h2 className="card-head-title">Minha semana</h2>
          <Icon name="chevronRight" size={18} className="muted" />
        </button>
        <div className="week">
          {days.map((d, i) => {
            const k = weekKeys[i]
            return (
              <div key={k} className="week-day">
                <span className="week-letter">{DOW_LETTERS[i]}</span>
                <span className={'week-num' + (k === today ? ' week-today' : '')}>{d.getDate()}</span>
                <span className={'week-dot' + (trainedDays.has(k) ? ' on' : '')} />
              </div>
            )
          })}
        </div>
        <div className="legend">
          <span className="legend-dot" /> Treino realizado
        </div>
      </section>
    </div>
  )
}
