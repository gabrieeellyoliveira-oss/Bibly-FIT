// Indicadores calculados a partir dos registros reais (nada fictício)
import { addDays, toKey } from './dates'

export const MEASURES = [
  { key: 'weight', label: 'Peso', unit: 'kg', icon: 'scale', lowerIsBetter: true },
  { key: 'waist', label: 'Cintura', unit: 'cm', icon: 'tape', lowerIsBetter: true },
  { key: 'hip', label: 'Quadril', unit: 'cm', icon: 'tape', lowerIsBetter: true },
  { key: 'thigh', label: 'Coxa', unit: 'cm', icon: 'tape', lowerIsBetter: true },
  { key: 'arm', label: 'Braço', unit: 'cm', icon: 'tape', lowerIsBetter: null },
]

const has = (v) => v !== '' && v != null && !Number.isNaN(Number(v))

// Dias seguidos com treino, contando até hoje (ou até ontem, se hoje ainda não treinou)
export function streakDays(logs) {
  const days = new Set(logs.map((l) => l.date))
  let d = new Date()
  if (!days.has(toKey(d))) d = addDays(d, -1)
  let n = 0
  while (days.has(toKey(d))) {
    n++
    d = addDays(d, -1)
  }
  return n
}

// Série histórica de uma medida (mais antiga → mais recente)
export function measureSeries(measures, key) {
  return [...measures]
    .filter((m) => has(m[key]))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((m) => ({ date: m.date, value: Number(m[key]) }))
}

// Variação em relação ao registro anterior e tom (positivo/neutro/atenção) pelo objetivo
export function measureTrend(series, lowerIsBetter) {
  if (series.length < 2) return null
  const last = series.at(-1).value
  const prev = series.at(-2).value
  const diff = Math.round((last - prev) * 10) / 10
  let tone = 'neutral'
  if (diff !== 0 && lowerIsBetter !== null) tone = (diff < 0) === lowerIsBetter ? 'good' : 'attention'
  return { diff, tone, since: series.at(-2).date }
}

// Maior carga registrada por exercício (para "nova carga máxima")
export function bestLoads(logs) {
  const best = {}
  let lastPr = null
  for (const l of [...logs].sort((a, b) => a.date.localeCompare(b.date))) {
    for (const [name, kg] of Object.entries(l.loads || {})) {
      const v = Number(kg)
      if (!v) continue
      if (best[name] && v > best[name]) lastPr = { name, kg: v, date: l.date }
      best[name] = Math.max(best[name] || 0, v)
    }
  }
  return { best, lastPr }
}

export function achievements(state) {
  const { logs = [], photos = [], measures = [] } = state
  const total = logs.length
  const streak = streakDays(logs)
  const photoDays = new Set(photos.map((p) => p.date)).size
  const { lastPr } = bestLoads(logs)
  const list = [
    { id: 'first', icon: 'check', title: 'Primeiro treino', desc: 'Você deu o primeiro passo.', goal: 1, value: total },
    { id: 'w5', icon: 'dumbbell', title: '5 treinos concluídos', desc: 'Constância começando.', goal: 5, value: total },
    { id: 'w10', icon: 'trophy', title: '10 treinos concluídos', desc: 'Dois dígitos de disciplina.', goal: 10, value: total },
    { id: 'w25', icon: 'trophy', title: '25 treinos concluídos', desc: 'Isso já é hábito.', goal: 25, value: total },
    { id: 'w50', icon: 'sparkle', title: '50 treinos concluídos', desc: 'Nível dedicação total.', goal: 50, value: total },
    { id: 's3', icon: 'flame', title: '3 dias seguidos', desc: 'O ritmo pegou.', goal: 3, value: streak },
    { id: 's7', icon: 'flame', title: '7 dias seguidos', desc: 'Uma semana sem parar.', goal: 7, value: streak },
    { id: 'photo', icon: 'camera', title: 'Primeiro registro de fotos', desc: 'Sua evolução começou a ser contada.', goal: 1, value: photoDays },
    { id: 'measure', icon: 'tape', title: 'Primeiras medidas', desc: 'Ponto de partida registrado.', goal: 1, value: measures.length },
  ].map((a) => ({ ...a, unlocked: a.value >= a.goal, progress: Math.min(1, a.value / a.goal) }))
  if (lastPr) {
    list.unshift({
      id: 'pr',
      icon: 'kettlebell',
      title: 'Nova carga máxima',
      desc: `${lastPr.name}: ${String(lastPr.kg).replace('.', ',')} kg`,
      unlocked: true,
      progress: 1,
    })
  }
  return { list, streak, total }
}

// Converte "90s", "1min", "1:30", "60" em segundos
export function parseRest(rest) {
  const s = String(rest || '').toLowerCase().trim()
  if (!s) return 60
  const mmss = s.match(/^(\d+):(\d{1,2})$/)
  if (mmss) return Number(mmss[1]) * 60 + Number(mmss[2])
  const n = parseFloat(s.replace(',', '.'))
  if (Number.isNaN(n)) return 60
  return /min/.test(s) ? Math.round(n * 60) : Math.round(n)
}
