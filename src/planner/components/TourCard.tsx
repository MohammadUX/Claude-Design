import { Layers, TriangleAlert, Truck } from 'lucide-react';
import { memo, type DragEvent } from 'react';
import { SEVERITY, TOUR_STATUS } from '../config';
import { useDnd } from '../actions';
import { etaLabel, routeFull, routeLabel, timeLabel, tourIssues } from '../selectors';
import type { Tour } from '../types';
import { usePlannerCtx } from './context';
import { Trunc } from './ui';

export function useTourDrag(tour: Tour) {
  const ctx = usePlannerCtx();
  const draggable = !ctx.readOnly && TOUR_STATUS[tour.status].editable;
  const dragging = useDnd((s) => !!s.ids?.includes(tour.id));
  const onDragStart = (e: DragEvent) => {
    const ids = ctx.selection.has(tour.id) ? [tour.id, ...[...ctx.selection].filter((x) => x !== tour.id)] : [tour.id];
    e.dataTransfer.setData('text/plain', ids.join(','));
    e.dataTransfer.effectAllowed = 'move';
    // Let the browser snapshot the element before we dim it.
    requestAnimationFrame(() => useDnd.getState().start(ids));
  };
  const onDragEnd = () => useDnd.getState().end();
  return { draggable, dragging, onDragStart, onDragEnd };
}

/** Plates line, or a warning when a vehicle is missing. */
export function VehicleLine({ tour }: { tour: Tour }) {
  const { idx } = usePlannerCtx();
  const tractor = tour.tractorId ? idx.tractorById.get(tour.tractorId)?.plate : undefined;
  const trailer = tour.trailerId ? idx.trailerById.get(tour.trailerId)?.plate : undefined;
  if (tour.status !== 'cancelled' && (!tractor || !trailer)) {
    return (
      <span className="tcard__warn">
        <TriangleAlert size={12} aria-hidden />
        <Trunc>{!tractor && !trailer ? 'Vehicle to assign' : !tractor ? `Tractor to assign · ${trailer}` : `${tractor} · trailer to assign`}</Trunc>
      </span>
    );
  }
  return (
    <span className="tcard__plates">
      <Truck size={12} aria-hidden />
      <Trunc>{`${tractor ?? '—'} · ${trailer ?? '—'}`}</Trunc>
    </span>
  );
}

export const TourCard = memo(function TourCard({ tour, full = false }: { tour: Tour; full?: boolean }) {
  const ctx = usePlannerCtx();
  const { draggable, dragging, onDragStart, onDragEnd } = useTourDrag(tour);
  const status = TOUR_STATUS[tour.status];
  const issues = tourIssues(ctx.idx, tour.id);
  const errors = issues.filter((i) => i.severity === 'error');
  const route = routeLabel(tour);
  const compact = ctx.density === 'compact' && !full;
  const client = tour.clientId ? ctx.idx.clientById.get(tour.clientId)?.name : undefined;
  const eta = etaLabel(tour);
  const selected = ctx.selection.has(tour.id);
  const stopsExtra = tour.stops.filter((s) => s.city).length - 2;

  const label = `${tour.id}, ${route || 'route to fill in'}${client ? `, ${client}` : ''}, ${status.label}${tour.start ? `, ${timeLabel(tour)}` : ''}${issues.length ? `, ${issues.map((i) => i.message).join(', ')}` : ''}`;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-pressed={selected}
      className={[
        'tcard',
        compact ? 'tcard--compact' : '',
        full ? 'tcard--full' : '',
        selected ? 'is-selected' : '',
        dragging ? 'is-dragging' : '',
        errors.length ? 'has-error' : '',
        tour.status === 'cancelled' ? 'is-cancelled' : '',
        tour.status === 'completed' ? 'is-completed' : '',
        ctx.matches?.has(tour.id) ? 'is-match' : '',
        draggable ? 'is-draggable' : '',
      ].join(' ')}
      style={{ ['--status' as string]: status.color }}
      data-tone={
        !tour.driverId
          ? 'unassigned'
          : errors.length && tour.status !== 'cancelled'
            ? 'issue'
            : ({ in_transit: 'live', assigned: 'plan', completed: 'done', draft: 'draft', delayed: 'late', cancelled: 'cancel' } as const)[tour.status]
      }
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
    >
      <div className="tcard__row">
        {route ? (
          <Trunc className="tcard__route" tip={`${tour.id} · ${routeFull(tour)}${client ? `\n${client}` : ''}`}>
            {route}
          </Trunc>
        ) : (
          <span className="tcard__route tcard__route--missing">Route to fill in</span>
        )}
        {stopsExtra > 0 && (
          <span className="tcard__stops" data-tip={routeFull(tour)}>
            +{stopsExtra}
          </span>
        )}
        {errors.length > 0 && (
          <span className="tcard__issue" data-tip={errors.map((i) => i.message).join('\n')} aria-hidden>
            <TriangleAlert size={13} strokeWidth={2.4} />
          </span>
        )}
      </div>
      <div className="tcard__row tcard__row--meta">
        <span className="tcard__time">{timeLabel(tour)}</span>
        <span aria-hidden>·</span>
        <span className="tcard__status">
          {tour.status === 'delayed' ? `+${tour.delayMin} min · ETA ${eta}` : tour.status === 'assigned' ? tour.id : status.label}
        </span>
      </div>
      {!compact && (
        <div className="tcard__row tcard__row--meta">
          <VehicleLine tour={tour} />
        </div>
      )}
      {full && client && (
        <div className="tcard__row tcard__row--meta">
          <Trunc className="tcard__client">{client}</Trunc>
        </div>
      )}
      {full && errors.length > 0 && (
        <ul className="tcard__issues">
          {errors.map((i) => (
            <li key={i.message}>
              <TriangleAlert size={12} aria-hidden /> {i.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

/** Cell with 2+ tours: one compact summary chip; click opens the list. */
export function MultiTourChip({ tours, onOpen }: { tours: Tour[]; onOpen: (rect: DOMRect) => void }) {
  const ctx = usePlannerCtx();
  const hasError = tours.some((t) => tourIssues(ctx.idx, t.id).some((i) => i.severity === 'error'));
  const anySelected = tours.some((t) => ctx.selection.has(t.id));
  const matched = tours.some((t) => ctx.matches?.has(t.id));
  const compact = ctx.density === 'compact';
  return (
    <button
      className={`multichip ${compact ? 'multichip--compact' : ''} ${hasError ? 'has-error' : ''} ${anySelected ? 'is-selected' : ''} ${matched ? 'is-match' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onOpen(e.currentTarget.getBoundingClientRect());
      }}
      aria-label={`${tours.length} tours: ${tours.map((t) => `${routeLabel(t) || 'route to fill in'} (${TOUR_STATUS[t.status].label})`).join('; ')}`}
    >
      <span className="multichip__head">
        <Layers size={13} aria-hidden />
        <b>{tours.length} tours</b>
        {hasError && <TriangleAlert size={13} strokeWidth={2.4} style={{ color: SEVERITY.error.color }} aria-hidden />}
        <span className="multichip__icons" aria-hidden>
          {tours.slice(0, 3).map((t) => {
            const S = TOUR_STATUS[t.status];
            return <S.icon key={t.id} size={12} strokeWidth={2.4} style={{ color: S.color }} />;
          })}
        </span>
      </span>
      {!compact &&
        tours.slice(0, 2).map((t) => (
          <span key={t.id} className="multichip__line">
            <span className="multichip__dot" style={{ background: TOUR_STATUS[t.status].color }} />
            <Trunc>{`${t.start ?? 'All day'} · ${routeLabel(t) || 'Route to fill in'}`}</Trunc>
          </span>
        ))}
      {compact && <Trunc className="multichip__line">{tours.map((t) => routeLabel(t) || '?').join(' / ')}</Trunc>}
    </button>
  );
}
