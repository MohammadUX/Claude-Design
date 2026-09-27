/** Pieces shared by the Week and Day grids: driver cell, group header, day summary. */
import { ChevronDown, ChevronRight, Inbox, Lock } from 'lucide-react';
import { memo } from 'react';
import { ABSENCE, DOC_STATE } from '../config';
import { fmtMedium } from '../date';
import { docLabel, initials, type DaySummary } from '../selectors';
import type { Absence, Driver } from '../types';
import type { DocKey } from '../config';
import { usePlannerCtx } from './context';
import { Avatar, DocDots, Trunc } from './ui';

export type RowItem =
  | { type: 'group'; key: string; label: string; count: number; busy: number; collapsed: boolean }
  | { type: 'driver'; driver: Driver };

export const GROUP_ROW_HEIGHT = 36;

export const DriverCell = memo(function DriverCell({ driver }: { driver: Driver }) {
  const ctx = usePlannerCtx();
  const tractor = driver.defaultTractorId ? ctx.idx.tractorById.get(driver.defaultTractorId) : undefined;
  const depot = ctx.idx.depotById.get(driver.depotId);
  const name = `${driver.firstName} ${driver.lastName}`;
  return (
    <div
      className="dcell"
      onMouseEnter={(e) => ctx.hoverDriver(driver, e.currentTarget.getBoundingClientRect())}
      onMouseLeave={() => ctx.hoverDriver(null)}
    >
      <Avatar text={initials(driver)} id={driver.id} size={ctx.density === 'compact' ? 28 : 32} />
      <div className="dcell__body">
        <Trunc className="dcell__name">{name}</Trunc>
        <div className="dcell__meta">
          <span className={`dcell__plate ${tractor ? '' : 'is-none'}`} data-tip={tractor ? `Default tractor · ${tractor.model}` : 'No default tractor'}>
            {tractor?.plate ?? 'No tractor'}
          </span>
          <DocDots driver={driver} refDate={ctx.today} />
        </div>
        {ctx.density === 'comfortable' && depot && <Trunc className="dcell__depot">{depot.name}</Trunc>}
      </div>
    </div>
  );
});

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
      data-tip={`${s.busy} busy · ${s.free} free · ${s.absent} absent${s.blocked ? ` · ${s.blocked} blocked (expired document)` : ''}`}
    >
      <div className="scell__nums">
        <span className="scell__n scell__n--busy">
          <b>{s.busy}</b> busy
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
