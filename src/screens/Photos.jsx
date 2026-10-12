import { useRef, useState } from 'react'
import Icon from '../components/Icon'
import Icon3D from '../components/Icon3D'
import { Empty, PageHeader, Sheet, Thumb, toast } from '../components/ui'
import { go } from '../lib/router'
import { hashPin, useStore } from '../lib/store'
import { MONTHS, fromKey, toKey, uid } from '../lib/dates'
import { compressImage, deletePhoto, putPhoto } from '../lib/photos'

const POSES = ['Frente', 'Lateral', 'Costas']
const UNLOCK_KEY = 'bibly:photos-unlocked'
const FILTERS = [
  { id: 'all', label: 'Tudo', days: null },
  { id: '30', label: '30 dias', days: 30 },
  { id: '90', label: '3 meses', days: 90 },
  { id: '365', label: '12 meses', days: 365 },
]

const daysBetween = (a, b) => Math.round((fromKey(b) - fromKey(a)) / 86400000)
const fmtDay = (k) => {
  const d = fromKey(k)
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3).toLowerCase()} ${d.getFullYear()}`
}
const ago = (k) => {
  const n = daysBetween(k, toKey())
  if (n <= 0) return 'hoje'
  if (n === 1) return 'ontem'
  if (n < 30) return `há ${n} dias`
  const m = Math.round(n / 30)
  return m === 1 ? 'há 1 mês' : `há ${m} meses`
}

export default function Photos() {
  const { state, update } = useStore()
  const [unlocked, setUnlocked] = useState(() => !state.pinHash || sessionStorage.getItem(UNLOCK_KEY) === '1')
  const [tab, setTab] = useState('timeline')
  const [filter, setFilter] = useState('all')
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

  const today = toKey()
  const days = FILTERS.find((f) => f.id === filter).days
  const photos = state.photos.filter((p) => !days || daysBetween(p.date, today) <= days)
  const dates = [...new Set(photos.map((p) => p.date))].sort((a, b) => b.localeCompare(a))

  const remove = async (p) => {
    if (!confirm('Excluir esta foto? Essa ação não pode ser desfeita.')) return
    await deletePhoto(p.id)
    update((s) => ({ photos: s.photos.filter((x) => x.id !== p.id) }))
    setMenu(null)
    toast('Foto excluída')
  }

  const hasAny = state.photos.length > 0

  return (
    <div className="stack">
      <PageHeader
        title="Minhas fotos"
        subtitle="Sua evolução, só sua"
        right={
          <button className="icon-btn icon-btn-surface" onClick={lock} aria-label="Trancar fotos">
            <Icon name="lock" size={20} />
          </button>
        }
      />

      <button className="ph-cta" onClick={() => setAdding(true)}>
        <Icon3D name="camera" size={46} />
        <span className="row-text">
          <strong>+ Adicionar foto</strong>
          <small>Frente, lateral e costas</small>
        </span>
        <Icon name="chevronRight" size={20} />
      </button>

      {!hasAny ? (
        <section className="card">
          <Empty
            icon="photo"
            title="Ainda não tem foto por aqui"
            text="Registre sua evolução para acompanhar suas mudanças ao longo do tempo. Só você vê essas fotos."
            action="Adicionar primeira foto"
            onAction={() => setAdding(true)}
          />
        </section>
      ) : (
        <>
          <div className="segmented" role="tablist">
            <button role="tab" aria-selected={tab === 'timeline'} className={tab === 'timeline' ? 'on' : ''} onClick={() => setTab('timeline')}>
              Linha do tempo
            </button>
            <button role="tab" aria-selected={tab === 'compare'} className={tab === 'compare' ? 'on' : ''} onClick={() => setTab('compare')}>
              Comparar
            </button>
          </div>

          {tab === 'timeline' ? (
            <>
              <div className="chips" role="group" aria-label="Filtrar por período">
                {FILTERS.map((f) => (
                  <button key={f.id} className={'chip' + (filter === f.id ? ' on' : '')} onClick={() => setFilter(f.id)} aria-pressed={filter === f.id}>
                    {f.label}
                  </button>
                ))}
              </div>

              {dates.length === 0 ? (
                <div className="card">
                  <Empty icon="calendar" title="Nada neste período" text="Escolha um período maior para ver suas fotos." />
                </div>
              ) : (
                <div className="timeline">
                  {dates.map((d) => {
                    const items = photos.filter((p) => p.date === d).sort((a, b) => POSES.indexOf(a.pose) - POSES.indexOf(b.pose))
                    return (
                      <section key={d} className="tl-item">
                        <div className="tl-head">
                          <span className="tl-date">{fmtDay(d)}</span>
                          <span className="tl-ago">{ago(d)}</span>
                        </div>
                        <div className="ph-grid">
                          {items.map((p) => (
                            <div key={p.id} className="ph-card">
                              <Thumb id={p.id} className="ph-img" onClick={() => setViewing(p)} alt={`${p.pose} em ${fmtDay(p.date)}`} />
                              <span className="ph-label">{p.pose}</span>
                              <button className="ph-more" onClick={() => setMenu(p)} aria-label={`Opções da foto ${p.pose}`}>
                                <Icon name="more" size={18} strokeWidth={2.4} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </section>
                    )
                  })}
                </div>
              )}
            </>
          ) : (
            <Compare photos={state.photos} onView={setViewing} onAdd={() => setAdding(true)} />
          )}
        </>
      )}

      <p className="private-note">
        <Icon name="lock" size={13} /> Suas fotos são privadas
      </p>

      <AddPhotosSheet open={adding} onClose={() => setAdding(false)} />

      <Sheet open={!!menu} onClose={() => setMenu(null)} title={menu ? `${menu.pose} · ${fmtDay(menu.date)}` : ''}>
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
                <Icon name="edit" size={18} /> Marcar como {pose}
              </button>
            ))}
            <button className="sheet-action danger" onClick={() => remove(menu)}>
              <Icon name="trash" size={18} /> Excluir foto
            </button>
          </div>
        )}
      </Sheet>

      {viewing && (
        <div className="viewer" onClick={() => setViewing(null)} role="dialog" aria-label="Foto ampliada">
          <Thumb id={viewing.id} className="viewer-img" alt={`${viewing.pose} em ${fmtDay(viewing.date)}`} />
          <div className="viewer-caption">
            {viewing.pose} · {fmtDay(viewing.date)}
          </div>
          <button className="icon-btn viewer-close" aria-label="Fechar">
            <Icon name="x" size={26} />
          </button>
        </div>
      )}
    </div>
  )
}

function Compare({ photos, onView, onAdd }) {
  const [pose, setPose] = useState('Frente')
  const ofPose = photos.filter((p) => p.pose === pose).sort((a, b) => a.date.localeCompare(b.date))
  const dates = [...new Set(ofPose.map((p) => p.date))]
  const [before, setBefore] = useState(null)
  const [after, setAfter] = useState(null)
  const b = dates.includes(before) ? before : dates[0]
  const a = dates.includes(after) ? after : dates.at(-1)
  const photoAt = (d) => ofPose.filter((p) => p.date === d).at(-1)

  return (
    <div className="stack">
      <div className="chips" role="group" aria-label="Escolher pose">
        {POSES.map((p) => (
          <button key={p} className={'chip' + (pose === p ? ' on' : '')} onClick={() => setPose(p)} aria-pressed={pose === p}>
            {p}
          </button>
        ))}
      </div>

      {dates.length < 2 ? (
        <div className="card">
          <Empty
            icon="photo"
            title="Falta uma foto para comparar"
            text={`Você precisa de fotos de ${pose.toLowerCase()} em pelo menos duas datas diferentes.`}
            action="Adicionar foto"
            onAction={onAdd}
          />
        </div>
      ) : (
        <>
          <div className="compare">
            {[
              ['Antes', b, setBefore],
              ['Depois', a, setAfter],
            ].map(([label, d, set]) => {
              const p = photoAt(d)
              return (
                <div key={label} className="compare-col">
                  <span className="compare-tag">{label}</span>
                  <div className="ph-card">{p && <Thumb id={p.id} className="ph-img" onClick={() => onView(p)} alt={`${pose} em ${fmtDay(d)}`} />}</div>
                  <select className="select" value={d} onChange={(e) => set(e.target.value)} aria-label={`Data da foto ${label.toLowerCase()}`}>
                    {dates.map((x) => (
                      <option key={x} value={x}>
                        {fmtDay(x)}
                      </option>
                    ))}
                  </select>
                </div>
              )
            })}
          </div>
          <p className="compare-summary">
            {daysBetween(b, a) === 0 ? 'Mesma data nas duas fotos' : `${Math.abs(daysBetween(b, a))} dias de evolução entre as fotos`}
          </p>
        </>
      )}
    </div>
  )
}

function AddPhotosSheet({ open, onClose }) {
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
      toast(uploaded ? `${pose} salva` : 'Foto salva no aparelho. Ela vai para a nuvem quando a conexão voltar.')
      setSaved((v) => ({ ...v, [pose]: true }))
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
        <label className="field">
          Data
          <input className="input" type="date" value={date} max={toKey()} onChange={(e) => setDate(e.target.value || toKey())} />
        </label>
        <div className="pose-slots">
          {POSES.map((pose) => (
            <button
              key={pose}
              className={'pose-slot' + (saved[pose] ? ' done' : '')}
              onClick={() => inputs.current[pose]?.click()}
              disabled={!!busy}
              aria-label={saved[pose] ? `${pose}: salva` : `Adicionar foto de ${pose}`}
            >
              {busy === pose ? <span className="spinner" /> : saved[pose] ? <Icon3D name="check" size={38} /> : <Icon3D name="camera" size={38} />}
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
        <button className="btn btn-primary btn-lg btn-block" onClick={close}>
          Pronto
        </button>
      </div>
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
        navigator.vibrate?.(120)
        setTimeout(() => setPin(''), 400)
      }
    }
  }

  return (
    <div className="pin">
      <Icon3D name="lock" size={72} />
      <h1 className="page-title" style={{ marginTop: 8 }}>
        Minhas fotos
      </h1>
      <p className="page-sub">{error ? 'PIN incorreto. Tente de novo.' : 'Digite seu PIN para ver suas fotos'}</p>
      <div className={'pin-dots' + (error ? ' shake' : '')} aria-label={`${pin.length} de 4 dígitos`}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={i < pin.length ? 'on' : ''} />
        ))}
      </div>
      <div className="pin-pad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, i) =>
          k === '' ? (
            <span key={i} />
          ) : (
            <button key={i} onClick={() => (k === '⌫' ? setPin(pin.slice(0, -1)) : press(k))} aria-label={k === '⌫' ? 'Apagar' : k}>
              {k}
            </button>
          ),
        )}
      </div>
    </div>
  )
}
