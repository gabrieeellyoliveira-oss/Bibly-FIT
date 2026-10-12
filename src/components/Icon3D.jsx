import { useId } from 'react'

// Ícones 3D da identidade Bibly: formas arredondadas com volume (gradiente radial),
// brilho suave e sombra de contato. Desenhados em SVG para ficarem nítidos e leves.
const PALETTE = {
  P: ['#A994FF', '#6C47FF', '#4424C4'], // roxo (principal)
  L: ['#F4F0FF', '#CFC2FF', '#9D88F5'], // lavanda
  C: ['#FFB9AE', '#FF6F5B', '#D8473A'], // coral
  K: ['#FFE6D4', '#FFB38A', '#E5875A'], // pêssego
  G: ['#FFEDB3', '#F5B83D', '#C68710'], // dourado
  W: ['#FFFFFF', '#F7F3EE', '#DCD3C8'], // branco/creme
  N: ['#EEECF3', '#BDB7CA', '#8C859C'], // neutro
  M: ['#C5F3E0', '#3CBF8F', '#1F8C64'], // verde (feito)
  R: ['#FFD6E0', '#F59BB0', '#D86C88'], // rosado (detalhe)
}

const SHAPES = {
  home: (f) => (
    <>
      <rect x="14" y="27" width="36" height="27" rx="7" fill={f('L')} />
      <path d="M8 31 32 10l24 21a3 3 0 0 1-4 4.5L32 18 12 35.5A3 3 0 0 1 8 31z" fill={f('P')} />
      <rect x="27" y="38" width="10" height="16" rx="4" fill={f('C')} />
      <ellipse cx="22" cy="32" rx="5" ry="2" fill="#fff" opacity=".6" />
    </>
  ),
  dumbbell: (f) => (
    <>
      <rect x="15" y="28.5" width="34" height="7" rx="3.5" fill={f('N')} />
      <rect x="3" y="23" width="7" height="18" rx="3.5" fill={f('P')} />
      <rect x="9" y="16" width="10" height="32" rx="5" fill={f('P')} />
      <rect x="45" y="16" width="10" height="32" rx="5" fill={f('P')} />
      <rect x="54" y="23" width="7" height="18" rx="3.5" fill={f('P')} />
      <rect x="11.5" y="19" width="2.6" height="13" rx="1.3" fill="#fff" opacity=".55" />
      <rect x="47.5" y="19" width="2.6" height="13" rx="1.3" fill="#fff" opacity=".55" />
    </>
  ),
  photo: (f) => (
    <>
      <rect x="13" y="11" width="40" height="36" rx="8" fill={f('L')} transform="rotate(-9 33 29)" />
      <rect x="9" y="16" width="46" height="37" rx="9" fill={f('W')} />
      <rect x="13.5" y="20.5" width="37" height="25" rx="5.5" fill="#EFEAFF" />
      <path d="M13.5 41 24 30.5l8 7.5 6-5 12.5 12V40v1a5.5 5.5 0 0 1-5.5 5.5H19a5.5 5.5 0 0 1-5.5-5.5z" fill={f('P')} />
      <circle cx="41" cy="28" r="4.5" fill={f('C')} />
    </>
  ),
  user: (f) => (
    <>
      <path d="M13 55c0-11 8.5-18 19-18s19 7 19 18z" fill={f('P')} />
      <circle cx="32" cy="23" r="12" fill={f('K')} />
      <ellipse cx="27" cy="18" rx="4" ry="2.4" fill="#fff" opacity=".6" />
      <ellipse cx="24" cy="44" rx="4" ry="2" fill="#fff" opacity=".35" />
    </>
  ),
  flame: (f) => (
    <>
      <path
        d="M32 5c6 10 19 17 19 32 0 11-8.5 19-19 19s-19-8-19-19c0-9 5.5-14 9-21 2 6 5 9 8 9 0-7 0-13 2-20z"
        fill={f('C')}
      />
      <path d="M32 29c4 5 10 8 10 15.5 0 5.5-4.5 10-10 10s-10-4.5-10-10c0-5 3.5-8 6-11.5 1 3 2.4 4 4 4z" fill={f('G')} />
      <ellipse cx="24" cy="30" rx="2.6" ry="5" fill="#fff" opacity=".45" transform="rotate(20 24 30)" />
    </>
  ),
  trophy: (f) => (
    <>
      <path d="M19 15h-6a7 7 0 0 0 7.5 13M45 15h6a7 7 0 0 1-7.5 13" fill="none" stroke={f('G')} strokeWidth="4.5" strokeLinecap="round" />
      <path d="M17 10h30v14a15 15 0 0 1-30 0z" fill={f('G')} />
      <rect x="28.5" y="37" width="7" height="9" rx="2" fill={f('G')} />
      <rect x="19" y="45" width="26" height="9" rx="4.5" fill={f('P')} />
      <path d="m32 15 2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7z" fill="#fff" opacity=".9" />
      <ellipse cx="22.5" cy="17" rx="2" ry="5" fill="#fff" opacity=".45" />
    </>
  ),
  calendar: (f) => (
    <>
      <rect x="9" y="14" width="46" height="41" rx="9" fill={f('W')} />
      <path d="M9 23a9 9 0 0 1 9-9h28a9 9 0 0 1 9 9v4H9z" fill={f('P')} />
      <rect x="19" y="8" width="5.5" height="12" rx="2.75" fill={f('N')} />
      <rect x="39.5" y="8" width="5.5" height="12" rx="2.75" fill={f('N')} />
      {[22, 32, 42].map((x) => (
        <circle key={'a' + x} cx={x} cy="36" r="3.2" fill={f('L')} />
      ))}
      <circle cx="22" cy="46" r="3.2" fill={f('L')} />
      <circle cx="32" cy="46" r="3.2" fill={f('L')} />
      <circle cx="42" cy="46" r="3.6" fill={f('C')} />
    </>
  ),
  tape: (f) => (
    <>
      <path d="M30 40h24a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H30z" fill={f('G')} />
      {[36, 42, 48].map((x) => (
        <rect key={x} x={x} y="40" width="1.8" height="6" rx=".9" fill="#fff" opacity=".85" />
      ))}
      <circle cx="27" cy="33" r="19" fill={f('C')} />
      <circle cx="27" cy="33" r="8" fill={f('K')} />
      <circle cx="27" cy="33" r="3" fill={f('C')} />
      <ellipse cx="19" cy="23" rx="5" ry="2.5" fill="#fff" opacity=".5" transform="rotate(-30 19 23)" />
    </>
  ),
  camera: (f) => (
    <>
      <rect x="22" y="13" width="20" height="11" rx="4" fill={f('P')} />
      <rect x="7" y="20" width="50" height="34" rx="10" fill={f('P')} />
      <circle cx="32" cy="37" r="12" fill={f('W')} />
      <circle cx="32" cy="37" r="8" fill={f('L')} />
      <circle cx="32" cy="37" r="3.6" fill={f('P')} />
      <circle cx="47.5" cy="28" r="2.6" fill={f('C')} />
      <ellipse cx="17" cy="25.5" rx="5" ry="1.8" fill="#fff" opacity=".45" />
      <ellipse cx="29" cy="33.5" rx="2.4" ry="1.4" fill="#fff" opacity=".8" />
    </>
  ),
  check: (f) => (
    <>
      <circle cx="32" cy="31" r="23" fill={f('M')} />
      <path d="m21.5 32 7.5 7.5 14-15" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="23" cy="18" rx="7" ry="3.2" fill="#fff" opacity=".45" transform="rotate(-25 23 18)" />
    </>
  ),
  moon: (f) => (
    <>
      <path d="M38 8a23 23 0 1 0 17 33A18 18 0 1 1 38 8z" fill={f('L')} />
      <path d="m48 12 1.5 3.4 3.4 1.5-3.4 1.5L48 21.8l-1.5-3.4-3.4-1.5 3.4-1.5zM55 26l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" fill={f('G')} />
      <ellipse cx="19" cy="24" rx="3" ry="6" fill="#fff" opacity=".55" transform="rotate(25 19 24)" />
    </>
  ),
  target: (f) => (
    <>
      <circle cx="30" cy="34" r="21" fill={f('W')} />
      <circle cx="30" cy="34" r="15" fill={f('C')} />
      <circle cx="30" cy="34" r="9.5" fill={f('W')} />
      <circle cx="30" cy="34" r="4.5" fill={f('C')} />
      <path d="M30 34 50 14" stroke={f('P')} strokeWidth="4" strokeLinecap="round" />
      <path d="m47 9 2 6 6 2-5 4-6-1-1-6z" fill={f('P')} />
    </>
  ),
  kettlebell: (f) => (
    <>
      <path d="M21 28a11 11 0 0 1 22 0" fill="none" stroke={f('P')} strokeWidth="6.5" strokeLinecap="round" />
      <circle cx="32" cy="38" r="17" fill={f('P')} />
      <ellipse cx="25" cy="31" rx="5" ry="3" fill="#fff" opacity=".45" transform="rotate(-30 25 31)" />
    </>
  ),
  timer: (f) => (
    <>
      <rect x="27" y="5" width="10" height="7" rx="3" fill={f('C')} />
      <circle cx="32" cy="35" r="21" fill={f('W')} />
      <circle cx="32" cy="35" r="16" fill={f('L')} />
      <path d="M32 35V24" stroke={f('P')} strokeWidth="4" strokeLinecap="round" />
      <circle cx="32" cy="35" r="3.5" fill={f('P')} />
      <ellipse cx="23" cy="24" rx="5" ry="2.4" fill="#fff" opacity=".6" transform="rotate(-35 23 24)" />
    </>
  ),
  sparkle: (f) => (
    <>
      <path d="M32 6c2 13 6 18 20 20-14 2-18 7-20 22-2-15-6-20-20-22 14-2 18-7 20-20z" fill={f('G')} />
      <path d="M50 40c.9 5 2.5 7 7 8-4.5 1-6.1 3-7 8-.9-5-2.5-7-7-8 4.5-1 6.1-3 7-8z" fill={f('L')} />
    </>
  ),
  scale: (f) => (
    <>
      <rect x="8" y="14" width="48" height="40" rx="12" fill={f('W')} />
      <rect x="18" y="20" width="28" height="11" rx="5" fill={f('L')} />
      <path d="M32 29v-5" stroke={f('P')} strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="22" cy="44" rx="6" ry="4" fill={f('N')} />
      <ellipse cx="42" cy="44" rx="6" ry="4" fill={f('N')} />
    </>
  ),
  lock: (f) => (
    <>
      <path d="M21 28v-6a11 11 0 0 1 22 0v6" fill="none" stroke={f('N')} strokeWidth="6" strokeLinecap="round" />
      <rect x="12" y="27" width="40" height="28" rx="9" fill={f('P')} />
      <circle cx="32" cy="39" r="4" fill="#fff" />
      <rect x="30.5" y="40" width="3" height="7" rx="1.5" fill="#fff" />
      <ellipse cx="21" cy="31" rx="5" ry="1.8" fill="#fff" opacity=".45" />
    </>
  ),
}

export const ICON3D_NAMES = Object.keys(SHAPES)

export default function Icon3D({ name, size = 40, muted = false, className = '', title }) {
  const raw = useId().replace(/:/g, '')
  const shape = SHAPES[name]
  if (!shape) return null
  const used = new Set()
  const f = (k) => {
    used.add(k)
    return `url(#${raw}${k})`
  }
  const body = shape(f)
  return (
    <svg
      className={'icon3d' + (muted ? ' icon3d-muted' : '') + (className ? ' ' + className : '')}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : 'true'}
      aria-label={title}
    >
      <defs>
        {[...used].map((k) => (
          <radialGradient key={k} id={raw + k} cx="35%" cy="28%" r="80%">
            <stop offset="0" stopColor={PALETTE[k][0]} />
            <stop offset=".55" stopColor={PALETTE[k][1]} />
            <stop offset="1" stopColor={PALETTE[k][2]} />
          </radialGradient>
        ))}
        <filter id={raw + 'blur'} x="-20%" y="-50%" width="140%" height="200%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
      </defs>
      <ellipse cx="32" cy="59" rx="19" ry="3.2" fill="#17152B" opacity=".16" filter={`url(#${raw}blur)`} />
      {body}
    </svg>
  )
}
