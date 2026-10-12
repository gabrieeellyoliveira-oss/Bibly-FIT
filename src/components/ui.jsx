import { useEffect, useState } from 'react'
import Icon from './Icon'
import { getPhoto } from '../lib/photos'

export function Ring({ value, label, sub }) {
  const r = 32
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(1, value))
  return (
    <div className="ring">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} className="ring-track" />
        <circle
          cx="40"
          cy="40"
          r={r}
          className="ring-bar"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          transform="rotate(-90 40 40)"
        />
        <text x="40" y="45" textAnchor="middle" className="ring-text">
          {Math.round(pct * 100)}%
        </text>
      </svg>
      <div className="ring-label">{label}</div>
      <div className="ring-sub">{sub}</div>
    </div>
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
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <div className="sheet-handle" />
        {title && <h3 className="sheet-title">{title}</h3>}
        {children}
      </div>
    </div>
  )
}

export function PageHeader({ title, subtitle, onBack, right }) {
  return (
    <header className="page-header">
      <div className="page-header-row">
        {onBack ? (
          <button className="icon-btn" onClick={onBack} aria-label="Voltar">
            <Icon name="chevronLeft" size={26} />
          </button>
        ) : (
          <span className="icon-btn-spacer" />
        )}
        <h1 className="serif page-title">{title}</h1>
        {right || <span className="icon-btn-spacer" />}
      </div>
      {subtitle && <p className="page-subtitle">{subtitle}</p>}
    </header>
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
    document.body.appendChild(el)
  }
  el.textContent = msg
  el.classList.add('show')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200)
}
