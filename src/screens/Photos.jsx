import { useRef, useState } from 'react'
import Icon from '../components/Icon'
import { PageHeader, Sheet, Thumb, toast } from '../components/ui'
import { go } from '../lib/router'
import { hashPin, useStore } from '../lib/store'
import { MONTHS, fmtBR, monthKey, toKey, uid } from '../lib/dates'
import { compressImage, deletePhoto, putPhoto } from '../lib/photos'

const POSES = ['Frente', 'Lateral', 'Costas']
const UNLOCK_KEY = 'bibly:photos-unlocked'

export default function Photos() {
  const { state, update } = useStore()
  const [unlocked, setUnlocked] = useState(() => !state.pinHash || sessionStorage.getItem(UNLOCK_KEY) === '1')
  const [month, setMonth] = useState(() => new Date())
  const [adding, setAdding] = useState(false)
  const [menu, setMenu] = useState(null)
  const [viewing, setViewing] = useState(null)

  const lock = () => {
    if (!state.pinHash) {
      toast('Crie um PIN no Perfil para trancar suas fotos')
      go('/perfil')
      return
    }
    sessionStorage.removeItem(UNLOCK_KEY)
    setUnlocked(false)
  }

  if (!unlocked) {
    return (
      <PinPad
        onUnlock={() => {
          sessionStorage.setItem(UNLOCK_KEY, '1')
          setUnlocked(true)
        }}
      />
    )
  }

  const mk = monthKey(month)
  const items = state.photos
    .filter((p) => p.date.startsWith(mk))
    .sort((a, b) => b.date.localeCompare(a.date) || POSES.indexOf(a.pose) - POSES.indexOf(b.pose))

  const shiftMonth = (n) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1))

  const remove = async (p) => {
    if (!confirm('Excluir esta foto?')) return
    await deletePhoto(p.id)
    update((s) => ({ photos: s.photos.filter((x) => x.id !== p.id) }))
    setMenu(null)
    toast('Foto excluída')
  }

  return (
    <div>
      <PageHeader
        title="Minhas fotos"
        subtitle={
          <>
            Sua evolução, só sua. <Icon name="heart" size={14} />
          </>
        }
        onBack={() => go('/')}
        right={
          <button className="icon-btn" onClick={lock} aria-label="Trancar fotos">
            <Icon name="lock" size={24} />
          </button>
        }
      />

      <div className="month-nav">
        <button className="icon-btn" onClick={() => shiftMonth(-1)} aria-label="Mês anterior">
          <Icon name="chevronLeft" size={22} />
        </button>
        <div className="month-pill">
          <Icon name="calendar" size={20} />
          {MONTHS[month.getMonth()]} {month.getFullYear()}
        </div>
        <button className="icon-btn" onClick={() => shiftMonth(1)} aria-label="Próximo mês">
          <Icon name="chevronRight" size={22} />
        </button>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <Icon name="camera" size={28} />
          <p>Nenhuma foto neste mês ainda.</p>
          <small>Registre frente, lateral e costas para comparar sua evolução.</small>
        </div>
      ) : (
        <div className="photo-grid">
          {items.map((p) => (
            <div key={p.id} className="photo-card">
              <Thumb id={p.id} className="photo-img" onClick={() => setViewing(p)} alt={`${p.pose} em ${fmtBR(p.date)}`} />
              <div className="photo-foot">
                <div>
                  <div className="photo-date">{fmtBR(p.date)}</div>
                  <div className="photo-pose">{p.pose}</div>
                </div>
                <button className="icon-btn icon-btn-sm" onClick={() => setMenu(p)} aria-label="Opções da foto">
                  <Icon name="more" size={18} strokeWidth={2.4} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="add-row add-row-pink" onClick={() => setAdding(true)}>
        <span className="add-icon add-icon-strong">
          <Icon name="camera" size={22} />
        </span>
        <span className="add-text">
          <strong>Adicionar novas fotos</strong>
          <small>Mantenha seu progresso registrado</small>
        </span>
        <Icon name="chevronRight" size={18} className="muted" />
      </button>

      <p className="private-note">
        <Icon name="lock" size={14} /> Suas fotos são privadas
      </p>

      <AddPhotosSheet open={adding} onClose={() => setAdding(false)} onSaved={(date) => setMonth(new Date(date + 'T12:00'))} />

      <Sheet open={!!menu} onClose={() => setMenu(null)} title={menu ? `${menu.pose} · ${fmtBR(menu.date)}` : ''}>
        {menu && (
          <div className="sheet-actions">
            {POSES.filter((p) => p !== menu.pose).map((pose) => (
              <button
                key={pose}
                className="sheet-action"
                onClick={() => {
                  update((s) => ({ photos: s.photos.map((x) => (x.id === menu.id ? { ...x, pose } : x)) }))
                  setMenu(null)
                  toast('Foto marcada como ' + pose)
                }}
              >
                Marcar como {pose}
              </button>
            ))}
            <button className="sheet-action danger" onClick={() => remove(menu)}>
              <Icon name="trash" size={18} /> Excluir foto
            </button>
          </div>
        )}
      </Sheet>

      {viewing && (
        <div className="viewer" onClick={() => setViewing(null)}>
          <Thumb id={viewing.id} className="viewer-img" />
          <div className="viewer-caption">
            {viewing.pose} · {fmtBR(viewing.date)}
          </div>
          <button className="viewer-close" aria-label="Fechar">
            <Icon name="x" size={26} />
          </button>
        </div>
      )}
    </div>
  )
}

function AddPhotosSheet({ open, onClose, onSaved }) {
  const { update } = useStore()
  const [date, setDate] = useState(toKey())
  const [busy, setBusy] = useState(null)
  const [saved, setSaved] = useState({})
  const inputs = useRef({})

  const pick = async (pose, file) => {
    if (!file) return
    setBusy(pose)
    try {
      const blob = await compressImage(file)
      const id = uid()
      const uploaded = await putPhoto(id, blob)
      update((s) => ({ photos: [...s.photos, { id, date, pose, pending: !uploaded }] }))
      if (!uploaded) toast('Foto salva no aparelho. Ela vai para a nuvem quando a conexão voltar.')
      setSaved((v) => ({ ...v, [pose]: true }))
      onSaved(date)
    } catch (e) {
      toast(e.message || 'Não foi possível salvar a foto')
    } finally {
      setBusy(null)
    }
  }

  const close = () => {
    setSaved({})
    onClose()
  }

  return (
    <Sheet open={open} onClose={close} title="Novas fotos">
      <div className="form">
        <label>
          Data
          <input type="date" value={date} max={toKey()} onChange={(e) => setDate(e.target.value || toKey())} />
        </label>
      </div>
      <div className="pose-slots">
        {POSES.map((pose) => (
          <button key={pose} className={'pose-slot' + (saved[pose] ? ' done' : '')} onClick={() => inputs.current[pose]?.click()} disabled={!!busy}>
            <Icon name={saved[pose] ? 'check' : 'camera'} size={26} />
            <span>{busy === pose ? 'Salvando…' : pose}</span>
            <input
              ref={(el) => (inputs.current[pose] = el)}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                pick(pose, e.target.files[0])
                e.target.value = ''
              }}
            />
          </button>
        ))}
      </div>
      <p className="sheet-hint">Dica: mesma luz, mesmo lugar e mesma roupa deixam a comparação mais fiel.</p>
      <button className="btn-primary" onClick={close}>
        Pronto
      </button>
    </Sheet>
  )
}

function PinPad({ onUnlock }) {
  const { state } = useStore()
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  const press = async (d) => {
    const next = (pin + d).slice(0, 4)
    setPin(next)
    setError(false)
    if (next.length === 4) {
      if ((await hashPin(next)) === state.pinHash) onUnlock()
      else {
        setError(true)
        setTimeout(() => setPin(''), 400)
      }
    }
  }

  return (
    <div className="pin">
      <Icon name="lock" size={34} className="pin-lock" />
      <h1 className="serif page-title">Minhas fotos</h1>
      <p className="page-subtitle">Digite seu PIN para ver suas fotos</p>
      <div className={'pin-dots' + (error ? ' shake' : '')}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={i < pin.length ? 'on' : ''} />
        ))}
      </div>
      <div className="pin-pad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, i) =>
          k === '' ? (
            <span key={i} />
          ) : (
            <button key={i} onClick={() => (k === '⌫' ? setPin(pin.slice(0, -1)) : press(k))}>
              {k}
            </button>
          ),
        )}
      </div>
    </div>
  )
}
