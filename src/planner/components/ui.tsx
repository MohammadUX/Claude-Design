import { Check, ChevronDown, Search, type LucideIcon } from 'lucide-react';
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { DOC_STATE, DOCS, TOUR_STATUS, type TourStatus } from '../config';
import { fmtFull, fmtRelativeDays, diffDays } from '../date';
import { docState } from '../selectors';
import type { Driver } from '../types';

/* ------------------------------------------------------------- Tooltip layer
 * One delegated tooltip for the whole app: any element with `data-tip` gets a tooltip.
 * `data-tip-overflow` shows it only when the element's text is truncated.
 * Cheap for thousands of cells (no per-element listeners).
 */
export function TooltipLayer() {
  const [tip, setTip] = useState<{ text: string; x: number; y: number; below: boolean } | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const show = (el: HTMLElement) => {
      const text = el.dataset.tip;
      if (!text) return;
      if (el.dataset.tipOverflow !== undefined && el.scrollWidth <= el.clientWidth + 1) return;
      const r = el.getBoundingClientRect();
      const below = r.top < 60;
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setTip({ text, x: r.left + r.width / 2, y: below ? r.bottom + 8 : r.top - 8, below }), 250);
    };
    const hide = () => {
      window.clearTimeout(timer.current);
      setTip(null);
    };
    const over = (e: Event) => {
      const el = (e.target as HTMLElement).closest?.('[data-tip]') as HTMLElement | null;
      if (el) show(el);
      else hide();
    };
    document.addEventListener('mouseover', over);
    document.addEventListener('focusin', over);
    document.addEventListener('mousedown', hide);
    document.addEventListener('dragstart', hide);
    document.addEventListener('scroll', hide, true);
    return () => {
      document.removeEventListener('mouseover', over);
      document.removeEventListener('focusin', over);
      document.removeEventListener('mousedown', hide);
      document.removeEventListener('dragstart', hide);
      document.removeEventListener('scroll', hide, true);
    };
  }, []);

  if (!tip) return null;
  return createPortal(
    <div
      className={`tooltip ${tip.below ? 'tooltip--below' : ''}`}
      role="tooltip"
      style={{ left: Math.min(Math.max(tip.x, 140), window.innerWidth - 140), top: tip.y }}
    >
      {tip.text}
    </div>,
    document.body,
  );
}

/** Text that truncates with "…" and shows a tooltip only when truncated. */
export function Trunc({ children, className = '', tip, style }: { children: string; className?: string; tip?: string; style?: CSSProperties }) {
  return (
    <span className={`trunc ${className}`} data-tip={tip ?? children} data-tip-overflow={tip ? undefined : ''} style={style}>
      {children}
    </span>
  );
}

/* ----------------------------------------------------------------- Popover */

export function Popover({
  anchor,
  onClose,
  children,
  className = '',
  placement = 'bottom-start',
  closeOnOutside = true,
  onMouseEnter,
  onMouseLeave,
}: {
  anchor: DOMRect;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  placement?: 'bottom-start' | 'bottom-end' | 'right-start' | 'top-start';
  closeOnOutside?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let left = placement === 'bottom-end' ? anchor.right - w : placement === 'right-start' ? anchor.right + 8 : anchor.left;
    let top = placement === 'right-start' ? anchor.top : placement === 'top-start' ? anchor.top - h - 6 : anchor.bottom + 6;
    if (placement === 'right-start' && left + w > vw - 8) left = anchor.left - w - 8;
    if (top + h > vh - 8) top = Math.max(8, placement === 'right-start' ? vh - h - 8 : anchor.top - h - 6);
    left = Math.max(8, Math.min(left, vw - w - 8));
    setPos({ left, top });
  }, [anchor, placement]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    const down = (e: MouseEvent) => {
      if (closeOnOutside && ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    window.addEventListener('keydown', key, true);
    const t = window.setTimeout(() => document.addEventListener('mousedown', down), 0);
    return () => {
      window.removeEventListener('keydown', key, true);
      window.clearTimeout(t);
      document.removeEventListener('mousedown', down);
    };
  }, [onClose, closeOnOutside]);

  return createPortal(
    <div
      ref={ref}
      className={`popover ${className}`}
      style={{ left: pos?.left ?? -9999, top: pos?.top ?? -9999 }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>,
    document.body,
  );
}

/* ------------------------------------------------------------ Menu / Button */

export function Menu({
  items,
  onClose,
  anchor,
  placement,
}: {
  items: ({ label: string; icon?: LucideIcon; onClick: () => void; danger?: boolean; disabled?: boolean; checked?: boolean; hint?: string } | 'sep')[];
  onClose: () => void;
  anchor: DOMRect;
  placement?: 'bottom-start' | 'bottom-end';
}) {
  return (
    <Popover anchor={anchor} onClose={onClose} className="menu" placement={placement}>
      {items.map((it, i) =>
        it === 'sep' ? (
          <div key={i} className="menu__sep" />
        ) : (
          <button
            key={i}
            className={`menu__item ${it.danger ? 'is-danger' : ''}`}
            disabled={it.disabled}
            onClick={() => {
              it.onClick();
              onClose();
            }}
          >
            {it.icon ? <it.icon size={15} /> : it.checked !== undefined ? <span className="menu__check">{it.checked && <Check size={14} />}</span> : null}
            <span>{it.label}</span>
            {it.hint && <kbd className="menu__hint">{it.hint}</kbd>}
          </button>
        ),
      )}
    </Popover>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  size = 'md',
  label,
}: {
  value: T;
  options: { value: T; label: ReactNode; tip?: string }[];
  onChange: (v: T) => void;
  size?: 'sm' | 'md';
  label: string;
}) {
  return (
    <div className={`segmented segmented--${size}`} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={o.value === value}
          className={`segmented__item ${o.value === value ? 'is-active' : ''}`}
          onClick={() => onChange(o.value)}
          data-tip={o.tip}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------- Status badge */

export function StatusBadge({ status, size = 'md', delayMin }: { status: TourStatus; size?: 'sm' | 'md'; delayMin?: number }) {
  const s = TOUR_STATUS[status];
  const Icon = s.icon;
  return (
    <span className={`badge badge--${size}`} style={{ color: s.color, background: s.bg }}>
      <Icon size={size === 'sm' ? 11 : 13} strokeWidth={2.4} aria-hidden />
      {s.label}
      {status === 'delayed' && delayMin ? ` +${delayMin}m` : ''}
    </span>
  );
}

/* -------------------------------------------------------------- Doc status */

export function docTooltip(driver: Driver, refDate: string) {
  return DOCS.map((d) => {
    const exp = driver.docs[d.key];
    const st = docState(exp, refDate);
    return `${d.label}: ${DOC_STATE[st].label} · ${fmtFull(exp)} (${fmtRelativeDays(diffDays(exp, refDate))})`;
  }).join('\n');
}

/** Three small dots (License / CQC / Tachograph). Each dot has a letter so status isn't color-only. */
export function DocDots({ driver, refDate }: { driver: Driver; refDate: string }) {
  return (
    <span className="docdots" data-tip={docTooltip(driver, refDate)} tabIndex={0} aria-label={docTooltip(driver, refDate)}>
      {DOCS.map((d) => {
        const st = docState(driver.docs[d.key], refDate);
        return (
          <span key={d.key} className={`docdot docdot--${st}`} style={{ color: DOC_STATE[st].color, background: DOC_STATE[st].bg }}>
            {d.short[0]}
          </span>
        );
      })}
    </span>
  );
}

export function DocList({ driver, refDate }: { driver: Driver; refDate: string }) {
  return (
    <ul className="doclist">
      {DOCS.map((d) => {
        const exp = driver.docs[d.key];
        const st = docState(exp, refDate);
        const c = DOC_STATE[st];
        return (
          <li key={d.key} className="doclist__row" style={{ color: c.color, background: c.bg }}>
            <span className="doclist__dot" />
            <b>{d.label}</b>
            <span className="doclist__date">{fmtFull(exp)}</span>
            <span className="doclist__state">{st === 'ok' ? 'Valid' : st === 'expired' ? 'Expired' : fmtRelativeDays(diffDays(exp, refDate))}</span>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------------------------------------------------------------- Avatar */

const AVATAR_HUES = [18, 200, 145, 265, 330, 45, 175, 225];
export function Avatar({ text, id, size = 28 }: { text: string; id: string; size?: number }) {
  const hue = AVATAR_HUES[id.charCodeAt(id.length - 1) % AVATAR_HUES.length];
  return (
    <span
      className="avatar"
      aria-hidden
      style={{ width: size, height: size, fontSize: size * 0.38, background: `hsl(${hue} 22% 22%)`, color: `hsl(${hue} 60% 82%)` }}
    >
      {text}
    </span>
  );
}

/* ------------------------------------------------------------ Smart select */

export interface SmartOption {
  value: string;
  label: string;
  sub?: string;
  /** 'available' first, 'busy' (selectable with note), 'unavailable' (disabled with reason). */
  state: 'available' | 'busy' | 'unavailable';
  reason?: string;
  badge?: string;
}

const GROUP_LABEL = { available: 'Available', busy: 'Busy that day', unavailable: 'Unavailable' } as const;

export function SmartSelect({
  value,
  options,
  onChange,
  placeholder,
  icon: Icon,
  allowClear = true,
  invalid,
  id,
}: {
  value?: string;
  options: SmartOption[];
  onChange: (v: string | undefined) => void;
  placeholder: string;
  icon?: LucideIcon;
  allowClear?: boolean;
  invalid?: boolean;
  id?: string;
}) {
  const btn = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState<DOMRect | null>(null);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const selected = options.find((o) => o.value === value);

  const groups = useMemo(() => {
    const ql = q.trim().toLowerCase();
    const list = options.filter((o) => !ql || `${o.label} ${o.sub ?? ''}`.toLowerCase().includes(ql));
    return (['available', 'busy', 'unavailable'] as const)
      .map((g) => ({ g, items: list.filter((o) => o.state === g) }))
      .filter((x) => x.items.length);
  }, [options, q]);
  const flat = groups.flatMap((g) => g.items).filter((o) => o.state !== 'unavailable');

  const choose = (v: string | undefined) => {
    onChange(v);
    setOpen(null);
    setQ('');
    btn.current?.focus();
  };

  return (
    <>
      <button
        ref={btn}
        id={id}
        type="button"
        className={`field__control select ${invalid ? 'is-invalid' : ''} ${selected ? '' : 'is-placeholder'}`}
        onClick={(e) => setOpen(e.currentTarget.getBoundingClientRect())}
        aria-haspopup="listbox"
        aria-expanded={!!open}
      >
        {Icon && <Icon size={15} className="select__icon" aria-hidden />}
        <span className="select__value">
          <Trunc>{selected ? selected.label : placeholder}</Trunc>
          {selected?.sub && <span className="select__sub">{selected.sub}</span>}
        </span>
        {selected && selected.state !== 'available' && selected.reason && (
          <span className={`select__warn select__warn--${selected.state}`}>{selected.reason}</span>
        )}
        <ChevronDown size={15} className="select__chev" aria-hidden />
      </button>
      {open && (
        <Popover anchor={open} onClose={() => setOpen(null)} className="smart" placement="bottom-start">
          <div className="smart__search">
            <Search size={14} aria-hidden />
            <input
              autoFocus
              value={q}
              placeholder="Search…"
              onChange={(e) => {
                setQ(e.target.value);
                setActive(0);
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setActive((a) => Math.min(a + 1, flat.length - 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setActive((a) => Math.max(a - 1, 0));
                } else if (e.key === 'Enter' && flat[active]) {
                  e.preventDefault();
                  choose(flat[active].value);
                }
              }}
              aria-label="Search options"
            />
          </div>
          <div className="smart__list" role="listbox" style={{ width: Math.max(open.width, 320) }}>
            {allowClear && value && (
              <button className="smart__opt smart__opt--clear" onClick={() => choose(undefined)}>
                Clear selection
              </button>
            )}
            {groups.length === 0 && <div className="smart__empty">No matches</div>}
            {groups.map(({ g, items }) => (
              <div key={g} className="smart__group">
                <div className="smart__label">
                  {GROUP_LABEL[g]} <span>{items.length}</span>
                </div>
                {items.map((o) => {
                  const i = flat.indexOf(o);
                  return (
                    <button
                      key={o.value}
                      role="option"
                      aria-selected={o.value === value}
                      aria-disabled={o.state === 'unavailable'}
                      disabled={o.state === 'unavailable'}
                      className={`smart__opt ${i === active ? 'is-active' : ''} ${o.value === value ? 'is-selected' : ''}`}
                      onMouseEnter={() => i >= 0 && setActive(i)}
                      onClick={() => choose(o.value)}
                    >
                      <span className="smart__main">
                        <Trunc>{o.label}</Trunc>
                        {o.badge && <span className="smart__badge">{o.badge}</span>}
                      </span>
                      <span className="smart__meta">
                        {o.sub && <Trunc className="smart__sub">{o.sub}</Trunc>}
                        {o.reason && <span className={`smart__reason smart__reason--${o.state}`}>{o.reason}</span>}
                      </span>
                      {o.value === value && <Check size={14} className="smart__tick" />}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </Popover>
      )}
    </>
  );
}
