import { useState } from 'react'
import Icon from '../components/Icon'
import Icon3D from '../components/Icon3D'
import { Empty, PageHeader, SectionHead, Sheet, toast } from '../components/ui'
import { go } from '../lib/router'
import { useStore } from '../lib/store'
import { fmtBR, toKey, uid } from '../lib/dates'
import { MEASURES, achievements, measureSeries, measureTrend } from '../lib/progress'

const fmt = (v) => String(v).replace('.', ',')

function Spark({ series, tone }) {
  if (series.length < 2) return null
  const vals = series.map((p) => p.value)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const pts = vals.map((v, i) => [(i / (vals.length - 1)) * 100, 30 - ((v - min) / (max - min || 1)) * 26])
  const color = tone === 'good' ? '#2FAE80' : tone === 'attention' ? '#FF6F5B' : '#6C47FF'
  const [lx, ly] = pts.at(-1)
  return (
    <svg className="spark" viewBox="0 0 100 34" preserveAspectRatio="none" aria-hidden="true">
      <polyline
        points={pts.map((p) => p.join(',')).join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={lx} cy={ly} r="3" fill={color} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export default function Evolution({ query }) {
  const { state, update } = useStore()
  const { measures } = state
  const today = toKey()
  const todays = measures.find((m) => m.date === today)
  const [open, setOpen] = useState(query === 'medir')
  const [form, setForm] = useState(() => Object.fromEntries(MEASURES.map((m) => [m.key, todays?.[m.key] ?? ''])))
  const [error, setError] = useState('')
  const { list } = achievements(state)
  const unlocked = list.filter((a) => a.unlocked)
  const locked = list.filter((a) => !a.unlocked)

  const history = [...measures].sort((a, b) => b.date.localeCompare(a.date))

  const save = (e) => {
    e.preventDefault()
    const entry = { id: todays?.id || uid(), date: today }
    let invalid = false
    MEASURES.forEach((m) => {
      const v = String(form[m.key]).replace(',', '.').trim()
      if (v !== '' && Number.isNaN(Number(v))) invalid = true
      entry[m.key] = v === '' || Number.isNaN(Number(v)) ? '' : Number(v)
    })
    if (invalid) return setError('Use só números, por exemplo 68,5.')
    if (MEASURES.every((m) => entry[m.key] === '')) return setError('Preencha pelo menos uma medida.')
    update((s) => ({ measures: [...s.measures.filter((m) => m.date !== today), entry] }))
    setError('')
    setOpen(false)
    toast('Medidas salvas')
  }

  const remove = (m) => {
    if (!confirm(`Excluir as medidas de ${fmtBR(m.date)}?`)) return
    update((s) => ({ measures: s.measures.filter((x) => x.id !== m.id) }))
    toast('Medidas excluídas')
  }

  return (
    <div className="stack">
      <PageHeader title="Minha evolução" subtitle="Seu corpo, seu progresso" onBack={() => go('/')} />

      <button className="ph-cta" onClick={() => setOpen(true)}>
        <Icon3D name="tape" size={46} />
        <span className="row-text">
          <strong>{todays ? 'Atualizar medidas de hoje' : 'Registrar medidas'}</strong>
          <small>Peso, cintura, quadril, coxa e braço</small>
        </span>
        <Icon name="plus" size={22} />
      </button>

      <section>
        <SectionHead title="Medidas" />
        {measures.length === 0 ? (
          <div className="card">
            <Empty
              icon="tape"
              title="Ainda sem medidas por aqui"
              text="Registre suas medidas hoje para ter um ponto de partida e acompanhar cada mudança."
              action="Registrar primeiras medidas"
              onAction={() => setOpen(true)}
            />
          </div>
        ) : (
          <div className="mgrid">
            {MEASURES.map((m, i) => {
              const series = measureSeries(measures, m.key)
              const trend = measureTrend(series, m.lowerIsBetter)
              const last = series.at(-1)
              return (
                <div key={m.key} className={'mcard' + (i === 0 ? ' mcard-wide' : '')}>
                  <div className="mcard-head">
                    <Icon3D name={m.icon} size={26} /> {m.label}
                  </div>
                  {last ? (
                    <>
                      <div className="mcard-value">
                        {fmt(last.value)}
                        <small>{m.unit}</small>
                      </div>
                      {trend ? (
                        <span className="trend-row">
                          <span className={'trend trend-' + trend.tone}>
                            {trend.diff > 0 ? '▲' : trend.diff < 0 ? '▼' : '='} {fmt(Math.abs(trend.diff))} {m.unit}
                          </span>
                          <small>desde {fmtBR(trend.since).slice(0, 5)}</small>
                        </span>
                      ) : (
                        <span className="mcard-empty">Primeiro registro</span>
                      )}
                      <Spark series={series} tone={trend?.tone} />
                    </>
                  ) : (
                    <span className="mcard-empty">Sem registro ainda</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {history.length > 0 && (
        <section className="card">
          <SectionHead title="Histórico" />
          <ul className="mhistory">
            {history.map((m) => (
              <li key={m.id}>
                <span className="mh-date">{fmtBR(m.date).slice(0, 5)}</span>
                <span className="mh-values">
                  {MEASURES.filter((f) => m[f.key] !== '' && m[f.key] != null).map((f) => (
                    <span key={f.key}>
                      {f.label} {fmt(m[f.key])} {f.unit}
                    </span>
                  ))}
                </span>
                <button className="icon-btn icon-btn-sm" onClick={() => remove(m)} aria-label={`Excluir medidas de ${fmtBR(m.date)}`}>
                  <Icon name="trash" size={16} />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <SectionHead title={`Conquistas · ${unlocked.length}/${list.length}`} />
        <div className="achv-grid">
          {[...unlocked, ...locked].map((a) => (
            <div key={a.id} className={'achv' + (a.unlocked ? ' unlocked' : '')}>
              <Icon3D name={a.icon} size={48} muted={!a.unlocked} />
              <strong>{a.title}</strong>
              <small>{a.unlocked ? a.desc : `${Math.min(a.value, a.goal)} de ${a.goal}`}</small>
              {!a.unlocked && (
                <div className="progress" aria-label={`${Math.round(a.progress * 100)}% concluído`}>
                  <span style={{ width: `${a.progress * 100}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <Sheet open={open} onClose={() => setOpen(false)} title="Medidas de hoje">
        <form className="form" onSubmit={save} noValidate>
          <div className="form-grid">
            {MEASURES.map((m) => (
              <label key={m.key} className="field">
                {m.label}
                <span className="input-group">
                  <input
                    inputMode="decimal"
                    value={form[m.key]}
                    onChange={(e) => setForm({ ...form, [m.key]: e.target.value })}
                    placeholder="—"
                    aria-label={`${m.label} em ${m.unit}`}
                  />
                  <small>{m.unit}</small>
                </span>
              </label>
            ))}
          </div>
          {error && (
            <p className="alert alert-error" role="alert">
              {error}
            </p>
          )}
          <button className="btn btn-primary btn-lg btn-block" type="submit">
            Salvar medidas
          </button>
        </form>
      </Sheet>
    </div>
  )
}
