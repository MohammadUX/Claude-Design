/**
 * Day board — the existing Fleeex pattern (driver on the left, that day's tour cards to the right),
 * cleaned up: compact documents, a live status line, real tour data and clear blocked/absent states.
 * Rows have variable height (cards wrap), so the virtualizer measures each row.
 */
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronRight, CircleCheck, CircleX, Clock, Inbox, Lock, Plus, TriangleAlert, Truck } from 'lucide-react';
import { memo, useRef } from 'react';
import { ABSENCE, DOC_STATE, DOCS, TOUR_STATUS } from '../config';
import { diffDays, fmtMedium, fmtRelativeDays, fmtShort, nowMin } from '../date';
import {
  absenceOn,
  blockingDoc,
  dayOfTour,
  docLabel,
  docState,
  driverNow,
  etaLabel,
  initials,
  isActive,
  isMultiDay,
  lastDay,
  routeFull,
  routeLabel,
  tourIssues,
  toursFor,
} from '../selectors';
import type { Driver, Tour } from '../types';
import { usePlannerCtx } from './context';
import { GroupRow, type RowItem } from './rows';
import { useTourDrag } from './TourCard';
import { Avatar, docTooltip, Trunc } from './ui';
import { useDropTarget } from './WeekGrid';

/* ------------------------------------------------------------- Tour card */

export const BoardCard = memo(function BoardCard({ tour, date }: { tour: Tour; date: string }) {
  const ctx = usePlannerCtx();
  const { draggable, dragging, onDragStart, onDragEnd } = useTourDrag(tour, date);
  const status = TOUR_STATUS[tour.status];
  const errors = tourIssues(ctx.idx, tour.id).filter((i) => i.severity === 'error');
  const tractor = tour.tractorId ? ctx.idx.tractorById.get(tour.tractorId) : undefined;
  const trailer = tour.trailerId ? ctx.idx.trailerById.get(tour.trailerId) : undefined;
  const client = tour.clientId ? ctx.idx.clientById.get(tour.clientId)?.name : undefined;
  const route = routeLabel(tour);
  const stopsExtra = tour.stops.filter((s) => s.city).length - 2;
  const multi = isMultiDay(tour);
  const day = multi ? dayOfTour(tour, date) : null;
  const eta = etaLabel(tour);
  const missingVehicle = tour.status !== 'cancelled' && (!tractor || !trailer);
  const tone = !tour.driverId
    ? 'unassigned'
    : errors.length && tour.status !== 'cancelled'
      ? 'issue'
      : ({ in_transit: 'live', assigned: 'plan', completed: 'done', draft: 'draft', delayed: 'late', cancelled: 'cancel' } as const)[tour.status];

  const when = multi
    ? `${fmtShort(tour.date)} – ${fmtShort(lastDay(tour))} (${day!.total}d)`
    : tour.start
      ? `${tour.start}${tour.end ? ` – ${tour.end}` : ''}`
      : 'No time set';

  return (
    <div
      role="button"
      tabIndex={0}
      data-tone={tone}
      className={[
        'bcard',
        ctx.selection.has(tour.id) ? 'is-selected' : '',
        dragging ? 'is-dragging' : '',
        ctx.matches?.has(tour.id) ? 'is-match' : '',
        draggable ? 'is-draggable' : '',
      ].join(' ')}
      style={{ ['--status' as string]: status.color }}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={(e) => {
        e.stopPropagation();
        ctx.onTourClick(tour, e);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          ctx.onTourClick(tour, e as never);
        }
      }}
      aria-label={`${tour.id}, ${route || 'tour to fill in'}, ${when}, ${status.label}`}
    >
      <div className={`bcard__vehicle ${missingVehicle ? 'is-missing' : ''}`}>
        {missingVehicle ? <TriangleAlert size={14} aria-hidden /> : <Truck size={14} aria-hidden />}
        <Trunc>
          {missingVehicle
            ? !tractor && !trailer
              ? 'Vehicle to be assigned'
              : !tractor
                ? `Tractor to assign · ${trailer!.plate}`
                : `${tractor.plate} · trailer to assign`
            : `${tractor?.plate ?? '—'} · ${trailer?.plate ?? '—'}`}
        </Trunc>
        <ChevronRight size={15} className="bcard__chev" aria-hidden />
      </div>

      <div className="bcard__route">
        {route ? (
          <Trunc tip={`${tour.id} · ${routeFull(tour)}`}>{route}</Trunc>
        ) : (
          <span className="bcard__todo">Tour to fill in</span>
        )}
        {stopsExtra > 0 && (
          <span className="bcard__stops" data-tip={routeFull(tour)}>
            +{stopsExtra} stop{stopsExtra > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="bcard__when">
        <span>{when}</span>
        {day && <span className="bcard__day">Day {day.n} of {day.total}</span>}
        {eta && <span className="bcard__eta">ETA {eta}</span>}
      </div>

      {errors.length > 0 && (
        <div className="bcard__issue" data-tip={errors.map((i) => i.message).join('\n')}>
          <TriangleAlert size={13} aria-hidden />
          <Trunc>{errors[0].message}</Trunc>
        </div>
      )}

      <div className="bcard__foot">
        <span className="bcard__status" data-status={tour.status}>
          <status.icon size={12} strokeWidth={2.4} aria-hidden />
          {status.label}
          {tour.status === 'delayed' && tour.delayMin ? ` +${tour.delayMin}m` : ''}
        </span>
        {client && <Trunc className="bcard__client">{client}</Trunc>}
      </div>
    </div>
  );
});

/* ------------------------------------------------------ Driver info cell */

const DOC_ICON = { ok: CircleCheck, expiring: Clock, expired: CircleX } as const;

/** Same neutral chip for every document; the icon and a slight text shade carry the state. */
function DocChips({ driver, refDate }: { driver: Driver; refDate: string }) {
  return (
    <div className="dchips" data-tip={docTooltip(driver, refDate)} tabIndex={0}>
      {DOCS.map((d) => {
        const exp = driver.docs[d.key];
        const st = docState(exp, refDate);
        const Icon = DOC_ICON[st];
        return (
          <span key={d.key} className={`dchip dchip--${st}`} aria-label={`${d.label}: ${DOC_STATE[st].label}`}>
            <Icon size={12} strokeWidth={2.2} className="dchip__icon" style={{ color: DOC_STATE[st].color }} aria-hidden />
            {d.key === 'tacho' ? 'Tacho' : d.label}
            {st !== 'ok' && <span className="dchip__date">{st === 'expired' ? 'expired' : fmtShort(exp)}</span>}
          </span>
        );
      })}
    </div>
  );
}

function DriverInfo({ driver, date, count }: { driver: Driver; date: string; count: number }) {
  const ctx = usePlannerCtx();
  const tractor = driver.defaultTractorId ? ctx.idx.tractorById.get(driver.defaultTractorId) : undefined;
  const now = driverNow(ctx.idx, driver, date, ctx.today, nowMin());
  return (
    <div
      className="binfo"
      onMouseEnter={(e) => ctx.hoverDriver(driver, e.currentTarget.getBoundingClientRect())}
      onMouseLeave={() => ctx.hoverDriver(null)}
    >
      <div className="binfo__head">
        <span className="dcell__avatar">
          <Avatar text={initials(driver)} id={driver.id} size={36} />
          <span className={`dcell__dot dcell__dot--${now.tone}`} aria-hidden />
        </span>
        <div className="binfo__who">
          <span className="binfo__nameline">
            <Trunc className="binfo__name">{`${driver.firstName} ${driver.lastName}`}</Trunc>
            {count > 0 && <span className="binfo__count">{count}</span>}
          </span>
          <Trunc className="binfo__truck">{tractor ? `${tractor.model} · ${tractor.plate}` : 'No usual tractor'}</Trunc>
        </div>
      </div>
      <Trunc className={`binfo__now dcell__now--${now.tone}`}>{now.text}</Trunc>
      <DocChips driver={driver} refDate={ctx.today} />
    </div>
  );
}

/* ------------------------------------------------------------- Rows */

function AddCard({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button className="badd" onClick={onClick} aria-label={label}>
      <Plus size={16} aria-hidden /> Add tour
    </button>
  );
}

const BoardRow = memo(function BoardRow({ driver, date }: { driver: Driver; date: string }) {
  const ctx = usePlannerCtx();
  const tours = toursFor(ctx.idx, driver.id, date);
  const absence = absenceOn(ctx.idx, driver.id, date);
  const doc = absence ? undefined : blockingDoc(driver, date);
  const drop = useDropTarget(driver.id, date);
  const active = tours.filter(isActive).length;

  return (
    <div className="brow">
      <DriverInfo driver={driver} date={date} count={active} />
      <div
        className={`brow__lane ${drop.check ? (drop.check.ok ? (drop.check.warning ? 'is-drop-warn' : 'is-drop-ok') : 'is-drop-bad') : ''}`}
        {...drop.handlers}
      >
        {absence && (
          <div className="bstate bstate--absent" data-tip={absence.note}>
            {(() => {
              const A = ABSENCE[absence.reason];
              return <A.icon size={16} aria-hidden />;
            })()}
            <div>
              <b>{ABSENCE[absence.reason].label}</b>
              <span>
                {absence.from === absence.to ? fmtMedium(absence.from) : `${fmtMedium(absence.from)} → ${fmtMedium(absence.to)}`}
                {absence.note ? ` · ${absence.note}` : ''}
              </span>
            </div>
          </div>
        )}
        {doc && (
          <div className="bstate bstate--blocked">
            <Lock size={16} aria-hidden />
            <div>
              <b>Can’t drive · {docLabel(doc)} expired</b>
              <span>
                Expired {fmtRelativeDays(diffDays(driver.docs[doc], ctx.today))}. Renew it to assign tours.
              </span>
            </div>
          </div>
        )}
        {tours.map((t) => (
          <BoardCard key={t.id} tour={t} date={date} />
        ))}
        {!absence && !doc && !ctx.readOnly && (
          <AddCard onClick={() => ctx.onCreate({ driverId: driver.id, date })} label={`Add a tour for ${driver.firstName} ${driver.lastName}`} />
        )}
        {drop.check && (
          <span className={`drophint ${drop.check.ok ? (drop.check.warning ? 'drophint--warn' : 'drophint--ok') : 'drophint--bad'}`}>
            {drop.check.ok ? drop.check.warning ?? `Drop to assign to ${driver.firstName}` : drop.check.reason}
          </span>
        )}
      </div>
    </div>
  );
});

function UnassignedLane({ date, tours }: { date: string; tours: Tour[] }) {
  const ctx = usePlannerCtx();
  const drop = useDropTarget(null, date);
  return (
    <div className="brow brow--unassigned">
      <div className="binfo binfo--unassigned">
        <div className="binfo__head">
          <span className="ucell__icon">
            <Inbox size={16} aria-hidden />
          </span>
          <div className="binfo__who">
            <span className="binfo__nameline">
              <span className="binfo__name">Waiting for a driver</span>
              {tours.length > 0 && <span className="binfo__count binfo__count--warn">{tours.length}</span>}
            </span>
            <span className="binfo__truck">Drag a card onto a driver</span>
          </div>
        </div>
      </div>
      <div className={`brow__lane brow__lane--scroll ${drop.check ? 'is-drop-ok' : ''}`} {...drop.handlers}>
        {tours.length === 0 && <span className="brow__empty">Every tour has a driver.</span>}
        {tours.map((t) => (
          <BoardCard key={t.id} tour={t} date={date} />
        ))}
        {!ctx.readOnly && <AddCard onClick={() => ctx.onCreate({ date })} label="Add a tour without driver" />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- Board */

interface Props {
  date: string;
  items: RowItem[];
  unassigned: Tour[];
  showUnassigned: boolean;
  autoHeight: boolean;
  onToggleGroup: (key: string) => void;
}

export function BoardView({ date, items, unassigned, showUnassigned, autoHeight, onToggleGroup }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const v = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (i) => (items[i].type === 'group' ? 44 : 150),
    overscan: 5,
    getItemKey: (i) => (items[i].type === 'group' ? `g:${(items[i] as { key: string }).key}` : (items[i] as { driver: Driver }).driver.id),
  });
  // Row heights are measured live (measureElement + ResizeObserver), so no manual re-measure.

  return (
    <div className={`board ${autoHeight ? 'board--auto' : ''}`}>
      {showUnassigned && <UnassignedLane date={date} tours={unassigned} />}
      <div ref={scrollRef} className="board__scroll">
      <div className="board__body" style={{ height: v.getTotalSize() }}>
        {v.getVirtualItems().map((vi) => {
          const it = items[vi.index];
          return (
            <div key={vi.key} data-index={vi.index} ref={v.measureElement} className="board__item" style={{ transform: `translateY(${vi.start}px)` }}>
              {it.type === 'group' ? <GroupRow item={it} onToggle={() => onToggleGroup(it.key)} /> : <BoardRow driver={it.driver} date={date} />}
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
