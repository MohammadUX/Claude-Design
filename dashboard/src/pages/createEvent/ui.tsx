import { ArrowDown01Icon, Cancel01Icon, InformationCircleIcon, Tick02Icon } from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'
import { useEffect, useRef, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import Icon from '../../components/Icon'

/** Figma dialog: frosted outer panel, round icon + title header, white inner card, actions below. */
export function DialogShell({
  icon,
  title,
  onClose,
  children,
  footer,
  width = 'max-w-[680px]',
  header,
}: {
  icon?: IconSvgElement
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  width?: string
  /** Replaces the icon + title (e.g. a Back button). */
  header?: ReactNode
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(35,40,40,0.1)] px-4 py-[8vh] backdrop-blur-[20px]" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className={`relative flex w-full ${width} flex-col gap-4 overflow-hidden rounded-[20px] border border-white p-5 shadow-[0_24px_64px_rgba(35,40,40,0.16)]`}
        style={{
          backgroundColor: 'rgba(246,247,247,0.94)',
          backgroundImage: 'radial-gradient(40% 70% at 30% 0%, color-mix(in srgb, var(--detail-accent) 16%, transparent), transparent 70%)',
        }}
      >
        <div className="flex items-center justify-between gap-3">
          {header ?? (
            <div className="flex items-center gap-3">
              {icon && (
                <span className="flex size-10 items-center justify-center rounded-full border border-ink-600/40 text-ink-800">
                  <Icon icon={icon} size={20} />
                </span>
              )}
              <h2 className="text-lg leading-[1.4] font-semibold text-ink-900">{title}</h2>
            </div>
          )}
          <button aria-label="Close" onClick={onClose} className="flex size-9 items-center justify-center rounded-full text-ink-800 hover:bg-white">
            <Icon icon={Cancel01Icon} size={22} />
          </button>
        </div>
        {children}
        {footer && <div className="flex items-center justify-between gap-3">{footer}</div>}
      </div>
    </div>
  )
}

export function InnerCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl bg-white p-5 ${className}`}>{children}</div>
}

export function PrimaryButton({ children, className = '', ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`rounded-full bg-brand-500 px-6 py-2.5 text-base leading-[1.4] font-medium text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  )
}

export function GhostButton({ children, className = '', ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} className={`rounded-full border border-ink-200 bg-white px-5 py-2.5 text-base leading-[1.4] font-medium text-ink-800 hover:bg-ink-100 ${className}`}>
      {children}
    </button>
  )
}

/** Section heading on the form: icon + 16px label, optional right slot. */
export function SectionTitle({ icon, children, right }: { icon: IconSvgElement; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className="flex items-center gap-2 text-base leading-[1.4] font-medium text-ink-900">
        <Icon icon={icon} size={20} />
        {children}
      </h3>
      {right}
    </div>
  )
}

/** Frosted white row/panel used throughout the form. */
export const panel = 'rounded-xl border border-white bg-white/80'

export function FieldLabel({ htmlFor, children, optional }: { htmlFor?: string; children: ReactNode; optional?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="flex items-center justify-between text-sm leading-[1.4] font-medium text-ink-800">
      {children}
      {optional && <span className="text-xs font-normal text-ink-600">Optional</span>}
    </label>
  )
}

export function TextInput({ invalid, className = '', ...rest }: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      {...rest}
      aria-invalid={invalid || undefined}
      className={`h-11 w-full rounded-xl border bg-white px-4 text-sm leading-[1.4] font-medium text-ink-900 outline-none placeholder:font-normal placeholder:text-ink-600 focus:border-brand-300 ${
        invalid ? 'border-danger-500' : 'border-ink-200'
      } ${className}`}
    />
  )
}

export function ErrorText({ children }: { children: ReactNode }) {
  return <p className="text-xs leading-[1.4] font-medium text-danger-500">{children}</p>
}

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-40 ${checked ? 'bg-brand-500' : 'bg-ink-200'}`}
    >
      <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-[left] ${checked ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  )
}

export function Radio({ checked, onChange, children, size = 'md' }: { checked: boolean; onChange: () => void; children: ReactNode; size?: 'sm' | 'md' }) {
  const outer = size === 'md' ? 'size-7' : 'size-5'
  const inner = size === 'md' ? 'size-3' : 'size-2'
  return (
    <button role="radio" aria-checked={checked} onClick={onChange} className="flex items-center gap-2 text-sm leading-[1.4] font-medium text-ink-800">
      <span className={`flex ${outer} items-center justify-center rounded-full border-2 ${checked ? 'border-brand-500 bg-brand-500' : 'border-ink-700/30 bg-transparent hover:border-ink-700/50'}`}>
        {checked && <span className={`${inner} rounded-full bg-white`} />}
      </span>
      {children}
    </button>
  )
}

export function InfoTip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <button type="button" aria-label={text} className="flex text-ink-600 hover:text-ink-900 focus-visible:text-ink-900">
        <Icon icon={InformationCircleIcon} size={16} />
      </button>
      <span className="pointer-events-none absolute top-6 left-1/2 z-30 hidden w-56 -translate-x-1/2 rounded-lg bg-ink-900 px-3 py-2 text-xs leading-[1.4] font-medium text-white shadow-lg group-focus-within:block group-hover:block">
        {text}
      </span>
    </span>
  )
}

/** Pill button with a small popover list (visibility, type, tier, role…). */
export function Dropdown<T extends string>({
  value,
  options,
  onChange,
  icon,
  render,
  className = '',
  menuAlign = 'left',
  size = 'md',
}: {
  value: T
  options: { value: T; label: string; hint?: string; icon?: IconSvgElement }[]
  onChange: (v: T) => void
  icon?: IconSvgElement
  render?: (label: string) => ReactNode
  className?: string
  menuAlign?: 'left' | 'right'
  size?: 'sm' | 'md'
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])
  const current = options.find((o) => o.value === value)
  const pad = size === 'md' ? 'p-2 text-sm gap-2' : 'px-2.5 py-1 text-xs gap-1'
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`flex items-center rounded-[40px] border border-white/40 bg-white/80 leading-[1.2] font-medium text-ink-800 hover:bg-white ${pad} ${className}`}
      >
        {(current?.icon || icon) && <Icon icon={(current?.icon ?? icon)!} size={size === 'md' ? 20 : 14} />}
        {render ? render(current?.label ?? '') : current?.label}
        <Icon icon={ArrowDown01Icon} size={size === 'md' ? 18 : 14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul className={`absolute top-full z-30 mt-1.5 flex min-w-[180px] flex-col rounded-xl border border-ink-200 bg-white p-1 shadow-[0_12px_32px_rgba(35,40,40,0.12)] ${menuAlign === 'right' ? 'right-0' : 'left-0'}`}>
          {options.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                onClick={() => {
                  onChange(o.value)
                  setOpen(false)
                }}
                className="flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left hover:bg-ink-100"
              >
                {o.icon && <Icon icon={o.icon} size={18} className="mt-px text-ink-700" />}
                <span className="flex flex-1 flex-col">
                  <span className="text-sm leading-[1.4] font-medium text-ink-900">{o.label}</span>
                  {o.hint && <span className="text-xs leading-[1.4] text-ink-600">{o.hint}</span>}
                </span>
                {o.value === value && <Icon icon={Tick02Icon} size={16} className="mt-0.5 text-brand-500" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
