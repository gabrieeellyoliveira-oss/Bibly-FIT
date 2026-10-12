import Icon3D from '../components/Icon3D'
import { Empty, PageHeader, SectionHead } from '../components/ui'
import { go } from '../lib/router'
import { useStore } from '../lib/store'
import { fmtBR } from '../lib/dates'
import { MEASURES, achievements, measureSeries, measureTrend } from '../lib/progress'

function Spark({ series }) {
  if (series.length < 2) return null
  const vals = series.map((p) => p.value)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * 100},${30 - ((v - min) / (max - min || 1)) * 26}`).join(' ')
  return (
    <svg className="spark" viewBox="0 0 100 34" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={pts} fill="none" stroke="#6C47FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export default function Evolution() {
  const { state } = useStore()
  const { list } = achievements(state)

  return (
    <div className="stack">
      <PageHeader title="Minha evolução" subtitle="Medidas e conquistas" onBack={() => go('/')} />

      <section>
        <SectionHead title="Medidas" action="Registrar" onAction={() => go('/perfil')} />
        {state.measures.length === 0 ? (
          <div className="card">
            <Empty icon="tape" title="Ainda sem medidas" text="Registre suas medidas para acompanhar a evolução do seu corpo." action="Registrar medidas" onAction={() => go('/perfil')} />
          </div>
        ) : (
          <div className="mgrid">
            {MEASURES.map((m, i) => {
              const series = measureSeries(state.measures, m.key)
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
                        {String(last.value).replace('.', ',')}
                        <small>{m.unit}</small>
                      </div>
                      {trend && (
                        <span className={'trend trend-' + trend.tone}>
                          {trend.diff > 0 ? '▲' : trend.diff < 0 ? '▼' : '='} {String(Math.abs(trend.diff)).replace('.', ',')} {m.unit} desde {fmtBR(trend.since).slice(0, 5)}
                        </span>
                      )}
                      <Spark series={series} />
                    </>
                  ) : (
                    <span className="mcard-empty">Sem registro</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section>
        <SectionHead title="Conquistas" />
        <div className="achv-grid">
          {list.map((a) => (
            <div key={a.id} className={'achv' + (a.unlocked ? ' unlocked' : '')}>
              <Icon3D name={a.icon} size={46} muted={!a.unlocked} />
              <strong>{a.title}</strong>
              <small>{a.unlocked ? a.desc : `${a.value} de ${a.goal}`}</small>
              {!a.unlocked && (
                <div className="progress">
                  <span style={{ width: `${a.progress * 100}%` }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
