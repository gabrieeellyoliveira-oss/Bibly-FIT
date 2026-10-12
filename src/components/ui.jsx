import { useEffect, useState } from 'react'
import Icon from './Icon'
import Icon3D from './Icon3D'
import { getPhoto } from '../lib/photos'

const RING_COLORS = {
  primary: ['#6C47FF', '#F2EEFF'],
  coral: ['#FF6F5B', '#FFF0EC'],
  peach: ['#F0955F', '#FFF5EE'],
}

export function Ring({ value, size = 64, color = 'primary', children }) {
  const r = 26
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(1, value || 0))
  const [stroke, track] = RING_COLORS[color] || RING_COLORS.primary
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={`${Math.round(pct * 100)}%`}>
      <circle cx="32" cy="32" r={r} className="ring-track" stroke={track} />
      <circle
        cx="32"
        cy="32"
        r={r}
        className="ring-bar"
        stroke={stroke}
        strokeDasharray={c}
        strokeDashoffset={c * (1 - pct)}
        transform="rotate(-90 32 32)"
      />
      {children ?? (
        <text x="32" y="37" textAnchor="middle" className="ring-text">
          {Math.round(pct * 100)}%
        </text>
      )}
    </svg>
  )
}

export function Sheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-handle" />
        {title && <h3 className="sheet-title">{title}</h3>}
        {children}
      </div>
    </div>
  )
}

export function PageHeader({ title, subtitle, onBack, right }) {
  return (
    <header className="page-head">
      {onBack && (
        <button className="icon-btn icon-btn-surface" onClick={onBack} aria-label="Voltar">
          <Icon name="chevronLeft" size={22} />
        </button>
      )}
      <div className="page-head-text">
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-sub">{subtitle}</p>}
      </div>
      {right}
    </header>
  )
}

export function SectionHead({ title, action, onAction }) {
  return (
    <div className="section-head">
      <h2 className="section-title">{title}</h2>
      {action && (
        <button className="section-link" onClick={onAction}>
          {action} <Icon name="chevronRight" size={16} />
        </button>
      )}
    </div>
  )
}

export function Empty({ icon, title, text, action, onAction }) {
  return (
    <div className="empty">
      {icon && <Icon3D name={icon} size={72} />}
      <p className="empty-title">{title}</p>
      {text && <p className="empty-text">{text}</p>}
      {action && (
        <button className="btn btn-primary" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  )
}

export function Thumb({ id, className, onClick, alt = '' }) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    let objectUrl
    let alive = true
    getPhoto(id).then((blob) => {
      if (alive && blob) {
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      }
    })
    return () => {
      alive = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [id])
  return url ? (
    <img src={url} className={className} onClick={onClick} alt={alt} />
  ) : (
    <div className={className + ' thumb-loading'} onClick={onClick} />
  )
}

let toastTimer
export function toast(msg) {
  let el = document.getElementById('toast')
  if (!el) {
    el = document.createElement('div')
    el.id = 'toast'
    el.setAttribute('role', 'status')
    el.setAttribute('aria-live', 'polite')
    document.body.appendChild(el)
  }
  el.textContent = msg
  el.classList.add('show')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400)
}
