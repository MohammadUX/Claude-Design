/** Pieces shared by the Week and Day grids: driver cell, group header, day summary. */
import { ChevronDown, ChevronRight, Inbox, Lock, ShieldCheck, TriangleAlert } from 'lucide-react';
import { memo } from 'react';
import { ABSENCE, DOC_STATE, DOCS } from '../config';
import { diffDays, fmtMedium } from '../date';
import { absenceOn, blockingDoc, docLabel, docState, initials, worstDocState, type DaySummary, type PlannerIndex } from '../selectors';
import type { Absence, Driver } from '../types';
import type { DocKey } from '../config';
import { usePlannerCtx } from './context';
import { Avatar, docTooltip, Trunc } from './ui';

export type RowItem =
  | { type: 'group'; key: string; label: string; count: number; busy: number; collapsed: boolean }
  | { type: 'driver'; driver: Driver };

export const GROUP_ROW_HEIGHT = 44;
/** Vertical gap between driver cards. */
export const ROW_GAP = 8;

/** One plain-language document line: only the most urgent document is mentioned. */
export function DocPill({ driver, refDate }: { driver: Driver; refDate: string }) {
  const worst = DOCS.map((d) => ({ d, exp: driver.docs[d.key], st: docState(driver.docs[d.key], refDate) }))
    .sort((a, b) => (a.st === b.st ? a.exp.localeCompare(b.exp) : a.st === 'expired' ? -1 : b.st === 'expired' ? 1 : a.st === 'expiring' ? -1 : 1))[0];
  const tip = docTooltip(driver, refDate);
  if (worst.st === 'ok')
    return (
      <span className="docpill docpill--ok" data-tip={tip} tabIndex={0}>
        <ShieldCheck size={12} aria-hidden /> Documents OK
      </span>
    );
  const days = diffDays(worst.exp, refDate);
  const text = worst.st === 'expired' ? `${worst.d.label} expired` : `${worst.d.label} ${days === 0 ? 'expires today' : `in ${days} days`}`;
  const c = DOC_STATE[worst.st];
  return (
    <span className={`docpill docpill--${worst.st}`} style={{ color: c.color, background: c.bg }} data-tip={tip} tabIndex={0}>
      {worst.st === 'expired' ? <Lock size={12} aria-hidden /> : <TriangleAlert size={12} aria-hidden />}
      <span className="trunc">{text}</span>
    </span>
  );
}

export const DriverCell = memo(function DriverCell({ driver, tourCount }: { driver: Driver; tourCount?: number }) {
  const ctx = usePlannerCtx();
  const tractor = driver.defaultTractorId ? ctx.idx.tractorById.get(driver.defaultTractorId) : undefined;
  const name = `${driver.firstName} ${driver.lastName}`;
  const compact = ctx.density === 'compact';
  return (
    <div
      className="dcell"
      onMouseEnter={(e) => ctx.hoverDriver(driver, e.currentTarget.getBoundingClientRect())}
      onMouseLeave={() => ctx.hoverDriver(null)}
    >
      <Avatar text={initials(driver)} id={driver.id} size={compact ? 32 : 40} />
      <div className="dcell__body">
        <Trunc className="dcell__name">{name}</Trunc>
        <span className="dcell__meta">
          <span className={tractor ? '' : 'is-none'} data-tip={tractor ? `Usual tractor · ${tractor.model}` : 'No usual tractor'}>
            {tractor?.plate ?? 'No tractor'}
          </span>
          {tourCount !== undefined && (
            <>
              <span aria-hidden>·</span>
              <span>{tourCount === 0 ? 'No tours' : `${tourCount} tour${tourCount > 1 ? 's' : ''}`}</span>
            </>
          )}
        </span>
        {!compact && <DocPill driver={driver} refDate={ctx.today} />}
      </div>
      {compact && <DocDot driver={driver} refDate={ctx.today} />}
    </div>
  );
});

/** Compact mode: a single dot + icon, details in the tooltip. */
function DocDot({ driver, refDate }: { driver: Driver; refDate: string }) {
  const st = worstDocState(driver, refDate);
  if (st === 'ok') return null;
  const c = DOC_STATE[st];
  return (
    <span className="docdot1" style={{ color: c.color, background: c.bg }} data-tip={docTooltip(driver, refDate)} tabIndex={0} aria-label={docTooltip(driver, refDate)}>
      {st === 'expired' ? <Lock size={12} /> : <TriangleAlert size={12} />}
    </span>
  );
}

/** Consecutive days of absence or blocked documents, drawn as one bar across the week row. */
export interface DaySpan {
  from: number;
  to: number;
  kind: 'absent' | 'blocked';
  absence?: Absence;
  doc?: DocKey;
}

export function daySpans(idx: PlannerIndex, driver: Driver, days: string[]): DaySpan[] {
  const spans: DaySpan[] = [];
  days.forEach((date, i) => {
    const absence = absenceOn(idx, driver.id, date);
    const doc = absence ? undefined : blockingDoc(driver, date);
    if (!absence && !doc) return;
    const last = spans.at(-1);
    const same = last && last.to === i - 1 && (absence ? last.absence?.id === absence.id : last.kind === 'blocked' && last.doc === doc);
    if (same) last.to = i;
    else spans.push({ from: i, to: i, kind: absence ? 'absent' : 'blocked', absence, doc });
  });
  return spans;
}

export function SpanBar({ span, hasTours }: { span: DaySpan; hasTours: boolean }) {
  const n = span.to - span.from + 1;
  const A = span.absence ? ABSENCE[span.absence.reason] : undefined;
  const label = A ? span.absence!.note ?? A.label : `Can’t drive · ${docLabel(span.doc!)} expired`;
  const tip = A
    ? `${A.label}${span.absence!.note ? ` · ${span.absence!.note}` : ''} · ${fmtMedium(span.absence!.from)} → ${fmtMedium(span.absence!.to)}`
    : `${docLabel(span.doc!)} expired. This driver can’t be assigned until it’s renewed.`;
  const Icon = A ? A.icon : Lock;
  return (
    <div
      className={`spanbar spanbar--${span.kind} ${hasTours ? 'has-tours' : ''}`}
      style={{ gridColumn: `${span.from + 2} / ${span.to + 3}` }}
      data-tip={tip}
    >
      <Icon size={14} aria-hidden />
      <span className="trunc">{label}</span>
      {A && n > 1 && <span className="spanbar__len">{n} days</span>}
    </div>
  );
}

export function GroupRow({ item, onToggle }: { item: Extract<RowItem, { type: 'group' }>; onToggle: () => void }) {
  return (
    <button className="grow" onClick={onToggle} aria-expanded={!item.collapsed}>
      <span className="grow__sticky">
        {item.collapsed ? <ChevronRight size={15} /> : <ChevronDown size={15} />}
        <b>{item.label}</b>
        <span className="grow__meta">
          {item.count} drivers · {item.busy} busy
        </span>
      </span>
    </button>
  );
}

export function SummaryCell({ s, total }: { s: DaySummary; total: number }) {
  const pct = (n: number) => `${total ? (n / total) * 100 : 0}%`;
  const off = s.absent + s.blocked;
  return (
    <div
      className="scell"
      data-tip={`${s.busy} working · ${s.free} free · ${s.absent} absent${s.blocked ? ` · ${s.blocked} blocked (expired document)` : ''}`}
    >
      <div className="scell__nums">
        <span className="scell__n scell__n--busy">
          <b>{s.busy}</b> working
        </span>
        <span className="scell__n scell__n--free">
          <b>{s.free}</b> free
        </span>
        <span className="scell__n scell__n--off">
          <b>{off}</b> off
        </span>
      </div>
      <div className="scell__bar" aria-hidden>
        <span style={{ width: pct(s.busy), background: 'var(--busy)' }} />
        <span style={{ width: pct(s.free), background: 'var(--free)' }} />
        <span style={{ width: pct(off), background: 'var(--off)' }} />
      </div>
    </div>
  );
}

/** Absent / blocked overlay text used in both grids. */
export function DayStateLabel({ absence, doc }: { absence?: Absence; doc?: DocKey }) {
  if (absence) {
    const A = ABSENCE[absence.reason];
    return (
      <span className="daystate daystate--absent" data-tip={`${A.label}${absence.note ? ` · ${absence.note}` : ''} · ${fmtMedium(absence.from)} → ${fmtMedium(absence.to)}`}>
        <A.icon size={13} aria-hidden />
        <Trunc>{absence.note ?? A.label}</Trunc>
      </span>
    );
  }
  if (doc) {
    return (
      <span className="daystate daystate--blocked" style={{ color: DOC_STATE.expired.color }} data-tip={`Blocked: ${docLabel(doc)} expired. The driver can’t be assigned until it’s renewed.`}>
        <Lock size={13} aria-hidden />
        <Trunc>{`${docLabel(doc)} expired`}</Trunc>
      </span>
    );
  }
  return null;
}

export function UnassignedHead({ count, expanded, onToggle, canExpand }: { count: number; expanded: boolean; onToggle: () => void; canExpand: boolean }) {
  return (
    <div className="ucell">
      <span className="ucell__icon">
        <Inbox size={15} aria-hidden />
      </span>
      <div className="ucell__body">
        <b>Unassigned</b>
        <span>{count === 0 ? 'All tours assigned' : `${count} tour${count > 1 ? 's' : ''} without driver`}</span>
      </div>
      {canExpand && (
        <button className="iconbtn iconbtn--sm" onClick={onToggle} aria-label={expanded ? 'Collapse unassigned row' : 'Expand unassigned row'} data-tip={expanded ? 'Collapse' : 'Expand'}>
          {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        </button>
      )}
    </div>
  );
}
