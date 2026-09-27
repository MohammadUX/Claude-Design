/**
 * Day board — the existing Fleeex pattern (driver on the left, that day's tour cards to the right),
 * cleaned up: compact documents, a live status line, real tour data and clear blocked/absent states.
 * Rows have variable height (cards wrap), so the virtualizer measures each row.
 */
import { useVirtualizer } from '@tanstack/react-virtual';
import { Inbox, Plus } from 'lucide-react';
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

const BoardCard = memo(function BoardCard({ tour, date }: { tour: Tour; date: string }) {
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
    ? `${fmtShort(tour.date)} – ${fmtShort(lastDay(tour))}`
    : tour.start
      ? `${tour.start}–${tour.end ?? ''}`
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
      <div className="bcard__top">
        {route ? (
          <Trunc className="bcard__route" tip={`${tour.id} · ${routeFull(tour)}${client ? `\n${client}` : ''}`}>
            {route}
          </Trunc>
        ) : (
          <span className="bcard__route bcard__todo">Tour to fill in</span>
        )}
        <span className="bcard__status" data-status={tour.status}>
          <span className="bcard__dot" aria-hidden />
          {status.label}
        </span>
      </div>
      <div className="bcard__meta">
        <span>{when}</span>
        {stopsExtra > 0 && <span data-tip={routeFull(tour)}>via {tour.stops.filter((s) => s.city).slice(1, -1).map((s) => s.city).join(', ')}</span>}
      </div>
      {!missingVehicle && tractor && <div className="bcard__plates">{`${tractor.plate} · ${trailer?.plate ?? '—'}`}</div>}
      {(missingVehicle || errors.length > 0 || tour.status === 'delayed' || day) && (
        <div className="bcard__note">
          {errors.length > 0 ? (
            <span className="is-bad" data-tip={errors.map((i) => i.message).join('\n')}>
              {errors[0].message}
            </span>
          ) : tour.status === 'delayed' ? (
            <span className="is-bad">
              {tour.delayMin} min late{eta ? ` · arrives ${eta}` : ''}
            </span>
          ) : missingVehicle ? (
            <span className="is-warn">
              {!tractor && !trailer ? 'Vehicle to be assigned' : !tractor ? 'Tractor to be assigned' : 'Semi-trailer to be assigned'}
            </span>
          ) : (
            <span>
              Day {day!.n} of {day!.total}
            </span>
          )}
        </div>
      )}
    </div>
  );
});

/* ------------------------------------------------------ Driver info cell */

/** Documents only speak up when something needs doing. */
function DocNotes({ driver, refDate }: { driver: Driver; refDate: string }) {
  const issues = DOCS.map((d) => ({ d, exp: driver.docs[d.key], st: docState(driver.docs[d.key], refDate) })).filter((x) => x.st !== 'ok');
  if (!issues.length) return null;
  return (
    <div className="bdocs" data-tip={docTooltip(driver, refDate)} tabIndex={0}>
      {issues.map(({ d, exp, st }) => (
        <span key={d.key} className={`bdoc bdoc--${st}`} style={{ color: DOC_STATE[st].color, background: DOC_STATE[st].bg }}>
          <span className="bcard__dot" aria-hidden />
          {d.key === 'tacho' ? 'Tachograph' : d.label} {st === 'expired' ? 'expired' : `expires ${fmtShort(exp)}`}
        </span>
      ))}
    </div>
  );
}

function DriverInfo({ driver, date }: { driver: Driver; date: string }) {
  const ctx = usePlannerCtx();
  const tractor = driver.defaultTractorId ? ctx.idx.tractorById.get(driver.defaultTractorId) : undefined;
  const now = driverNow(ctx.idx, driver, date, ctx.today, nowMin());
  return (
    <div
      className="binfo"
      onMouseEnter={(e) => ctx.hoverDriver(driver, e.currentTarget.getBoundingClientRect())}
      onMouseLeave={() => ctx.hoverDriver(null)}
    >
      <Avatar text={initials(driver)} id={driver.id} size={36} />
      <div className="binfo__who">
        <Trunc className="binfo__name">{`${driver.firstName} ${driver.lastName}`}</Trunc>
        <Trunc className="binfo__sub">{tractor ? `${tractor.model} · ${tractor.plate}` : 'No usual tractor'}</Trunc>
        <Trunc className={`binfo__now binfo__now--${now.tone}`}>{now.text}</Trunc>
        <DocNotes driver={driver} refDate={ctx.today} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- Rows */

function AddCard({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button className="badd" onClick={onClick} aria-label={label}>
      <Plus size={14} aria-hidden /> Add tour
    </button>
  );
}

const BoardRow = memo(function BoardRow({ driver, date }: { driver: Driver; date: string }) {
  const ctx = usePlannerCtx();
  const tours = toursFor(ctx.idx, driver.id, date);
  const absence = absenceOn(ctx.idx, driver.id, date);
  const doc = absence ? undefined : blockingDoc(driver, date);
  const drop = useDropTarget(driver.id, date);

  return (
    <div className="brow">
      <DriverInfo driver={driver} date={date} />
      <div
        className={`brow__lane ${drop.check ? (drop.check.ok ? (drop.check.warning ? 'is-drop-warn' : 'is-drop-ok') : 'is-drop-bad') : ''}`}
        {...drop.handlers}
      >
        {absence && (
          <p className="bstate">
            {ABSENCE[absence.reason].label}
            <span>
              {absence.from === absence.to ? fmtMedium(absence.from) : `${fmtMedium(absence.from)} – ${fmtMedium(absence.to)}`}
              {absence.note ? ` · ${absence.note}` : ''}
            </span>
          </p>
        )}
        {doc && (
          <p className="bstate">
            No tours until the {docLabel(doc)} is renewed
            <span>Expired {fmtRelativeDays(diffDays(driver.docs[doc], ctx.today))}</span>
          </p>
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
