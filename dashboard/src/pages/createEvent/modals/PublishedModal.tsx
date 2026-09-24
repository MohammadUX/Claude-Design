import { Copy01Icon, DashboardSquare01Icon, InternetIcon, QrCodeIcon, Tick02Icon, ViewIcon } from '@hugeicons/core-free-icons'
import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import { EventArt } from '../../../components/EventCard'
import Icon from '../../../components/Icon'
import type { EventItem } from '../../../data/mock'

const CONFETTI_COLORS = ['#00b5b4', '#f59e0b', '#e5484d', '#6d5bd0', '#2563eb', '#16a34a', '#ec4899']

/** Deterministic pseudo-random so the burst renders the same every time. */
const rand = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}
const PIECES = Array.from({ length: 90 }, (_, i) => ({
  left: rand(i + 1) * 100,
  delay: rand(i + 101) * 0.9,
  duration: 2.4 + rand(i + 201) * 1.8,
  size: 6 + rand(i + 301) * 8,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  round: i % 3 === 0,
  drift: (rand(i + 401) - 0.5) * 160,
}))

function Confetti() {
  const pieces = PIECES
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[60] overflow-hidden motion-reduce:hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece absolute top-[-20px]"
          style={
            {
              left: `${p.left}%`,
              width: p.size,
              height: p.round ? p.size : p.size * 0.4,
              background: p.color,
              borderRadius: p.round ? '50%' : 2,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              '--drift': `${p.drift}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}

type Props = {
  event: EventItem
  whenLine: string
  link: string
  onDashboard: () => void
  onPreview: () => void
}

/** Figma "Success message": confetti, the poster, the shareable link and next steps. */
export default function PublishedModal({ event, whenLine, link, onDashboard, onPreview }: Props) {
  const [copied, setCopied] = useState(false)
  const [qr, setQr] = useState<string | null>(null)
  const [showQr, setShowQr] = useState(false)

  useEffect(() => {
    QRCode.toDataURL(`https://${link}`, { margin: 1, width: 360, color: { dark: '#232828', light: '#ffffff' } }).then(setQr)
  }, [link])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`https://${link}`)
    } catch {
      /* Clipboard can be blocked; the link stays visible and selectable. */
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(35,40,40,0.1)] px-4 py-[8vh] backdrop-blur-[20px]">
      <Confetti />
      <div role="dialog" aria-modal="true" aria-labelledby="published-title" className="relative z-[61] flex w-full max-w-[760px] flex-col gap-5 rounded-[20px] bg-white p-6 shadow-[0_24px_64px_rgba(35,40,40,0.18)]">
        <div className="flex flex-col gap-1">
          <h2 id="published-title" className="text-xl leading-[1.3] font-semibold text-ink-900">
            Your event is live
          </h2>
          <p className="text-sm leading-[1.4] font-medium text-ink-700">{whenLine}</p>
        </div>
        <div className="relative aspect-[2/1] w-full overflow-hidden rounded-xl">
          {showQr && qr ? (
            <div className="absolute inset-0 flex items-center justify-center gap-6 bg-ink-100">
              <img src={qr} alt={`QR code for ${link}`} className="size-[180px] rounded-lg" />
              <p className="max-w-[220px] text-sm leading-[1.5] text-ink-800">
                Guests can scan this to open the event page. Show it on a slide or print it on your flyers.
              </p>
            </div>
          ) : event.image ? (
            <>
              {/* Poster shown whole on a blurred copy of itself, so portrait covers aren't cropped */}
              <img src={event.image} alt="" aria-hidden className="absolute inset-0 size-full scale-110 object-cover blur-2xl" />
              <img src={event.image} alt={`${event.title} cover`} className="absolute inset-y-4 left-1/2 h-[calc(100%-32px)] -translate-x-1/2 rounded-lg object-contain shadow-lg" />
            </>
          ) : (
            <EventArt event={event} large />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-ink-800">Event link</span>
          <div className="flex h-12 items-center gap-2.5 rounded-full border border-ink-200 px-4">
            <Icon icon={InternetIcon} size={20} className="text-ink-700" />
            <span className="min-w-0 flex-1 truncate text-base text-ink-900 select-all">https://{link}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button onClick={copy} className="flex min-w-[180px] items-center justify-center gap-2 rounded-full bg-brand-500 px-6 py-2.5 text-base font-medium text-white hover:brightness-95">
            <Icon icon={copied ? Tick02Icon : Copy01Icon} size={18} />
            {copied ? 'Link copied' : 'Copy link'}
          </button>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: 'Dashboard', icon: DashboardSquare01Icon, run: onDashboard, pressed: undefined },
              { label: showQr ? 'Hide QR code' : 'QR code', icon: QrCodeIcon, run: () => setShowQr((v) => !v), pressed: showQr },
              { label: 'Preview event', icon: ViewIcon, run: onPreview, pressed: undefined },
            ].map((b) => (
              <button key={b.label} onClick={b.run} aria-pressed={b.pressed} className="flex items-center gap-2 rounded-full bg-ink-100 px-4 py-2 text-sm font-medium text-ink-900 hover:bg-ink-200">
                <Icon icon={b.icon} size={18} />
                {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
