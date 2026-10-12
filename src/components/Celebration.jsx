import { useEffect, useRef } from 'react'
import Icon from './Icon'
import Icon3D from './Icon3D'

const COLORS = ['#6C47FF', '#8A6BFF', '#B9A8FF', '#FF6F5B', '#FFB38A', '#F5B83D', '#F59BB0']

// Confetes desenhados num canvas (sem biblioteca), caindo por ~4 segundos
function useConfetti(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const resize = () => {
      canvas.width = innerWidth * dpr
      canvas.height = innerHeight * dpr
    }
    resize()
    addEventListener('resize', resize)

    const count = reduce ? 40 : 170
    const pieces = Array.from({ length: count }, (_, i) => {
      const fromLeft = i % 2 === 0
      return {
        // dois "canhões" saindo dos cantos de baixo, mais uma chuva do topo
        x: i < count * 0.6 ? (fromLeft ? 0 : innerWidth) : Math.random() * innerWidth,
        y: i < count * 0.6 ? innerHeight * 0.75 : -20 - Math.random() * innerHeight * 0.5,
        vx: i < count * 0.6 ? (fromLeft ? 1 : -1) * (3 + Math.random() * 7) : (Math.random() - 0.5) * 2,
        vy: i < count * 0.6 ? -(9 + Math.random() * 9) : 1 + Math.random() * 2,
        size: 6 + Math.random() * 7,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        shape: Math.random() < 0.25 ? 'circle' : Math.random() < 0.5 ? 'heart' : 'rect',
      }
    })

    let raf
    const start = performance.now()
    const heart = (s) => {
      ctx.beginPath()
      ctx.moveTo(0, s * 0.3)
      ctx.bezierCurveTo(0, 0, -s * 0.5, 0, -s * 0.5, s * 0.3)
      ctx.bezierCurveTo(-s * 0.5, s * 0.6, 0, s * 0.8, 0, s)
      ctx.bezierCurveTo(0, s * 0.8, s * 0.5, s * 0.6, s * 0.5, s * 0.3)
      ctx.bezierCurveTo(s * 0.5, 0, 0, 0, 0, s * 0.3)
      ctx.fill()
    }
    const frame = (t) => {
      const elapsed = t - start
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, innerWidth, innerHeight)
      const fade = elapsed > 3200 ? Math.max(0, 1 - (elapsed - 3200) / 900) : 1
      ctx.globalAlpha = fade
      for (const p of pieces) {
        p.vy += 0.22
        p.vx *= 0.99
        p.x += p.vx + Math.sin((elapsed + p.size * 100) / 300) * 0.6
        p.y += p.vy * 0.6
        p.rot += p.vr
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillStyle = p.color
        if (p.shape === 'circle') {
          ctx.beginPath()
          ctx.arc(0, 0, p.size / 2.6, 0, Math.PI * 2)
          ctx.fill()
        } else if (p.shape === 'heart') heart(p.size * 1.1)
        else ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
        ctx.restore()
      }
      if (elapsed < 4200) raf = requestAnimationFrame(frame)
      else ctx.clearRect(0, 0, innerWidth, innerHeight)
    }
    raf = requestAnimationFrame(frame)
    navigator.vibrate?.([30, 40, 60])
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('resize', resize)
    }
  }, [canvasRef])
}

export default function Celebration({ name, workoutName, durationMin, completed, total, onClose }) {
  const canvasRef = useRef(null)
  useConfetti(canvasRef)

  return (
    <div className="celebration" role="dialog" aria-label="Parabéns">
      <canvas ref={canvasRef} className="confetti" aria-hidden="true" />
      <div className="celebration-card">
        <Icon3D name="trophy" size={88} />
        <span className="eyebrow">Treino concluído</span>
        <h2>Parabéns{name ? `, ${name}` : ''}!</h2>
        <p className="celebration-text">
          Você concluiu o <strong>{workoutName}</strong>. Cada treino te deixa mais forte.
        </p>
        <div className="chips chips-center">
          <span className="chip">
            <Icon name="clock" size={15} /> {durationMin} min
          </span>
          <span className="chip">
            <Icon name="dumbbell" size={15} /> {completed}/{total} exercícios
          </span>
        </div>
        <button className="btn btn-primary btn-lg btn-block" onClick={onClose}>
          Voltar ao início <Icon name="arrowRight" size={18} />
        </button>
      </div>
    </div>
  )
}
