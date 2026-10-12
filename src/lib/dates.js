export const pad = (n) => String(n).padStart(2, '0')

export const toKey = (d = new Date()) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const fromKey = (k) => {
  const [y, m, d] = k.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const fmtBR = (k) => {
  const [y, m, d] = k.split('-')
  return `${d}/${m}/${y}`
}

export const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export const DOW_LETTERS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']

// Semana começando na segunda-feira
export function weekDays(ref = new Date()) {
  const start = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate())
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

export const monthKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`

export const daysInMonth = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
