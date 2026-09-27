import { useVirtualizer } from '@tanstack/react-virtual';
import { TriangleAlert } from 'lucide-react';
import { createContext, memo, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type DragEvent, type MouseEvent } from 'react';
import { DAY_VIEW, DENSITY, SEVERITY, TOUR_STATUS, WEEK_VIEW } from '../config';
import { useDnd } from '../actions';
import { fromMin, nowMin, toMin } from '../date';
import { absenceOn, blockingDoc, daySummary, EMPTY_TOURS, etaLabel, isActive, routeFull, routeLabel, timeLabel, tourIssues, toursFor } from '../selectors';
import type { Driver, Tour } from '../types';
import { usePlannerCtx } from './context';
import { DayStateLabel, DriverCell, GROUP_ROW_HEIGHT, GroupRow, ROW_GAP, SummaryCell, UnassignedHead, type RowItem } from './rows';
import { MultiTourChip, TourCard, useTourDrag, VehicleLine } from './TourCard';
import { useDropTarget } from './WeekGrid';

const ALLDAY_W = 168;

/** Minutes since midnight when the grid shows today, else null. */
const NowCtx = createContext<number | null>(null);
function NowSeg({ label = false }: { label?: boolean }) {
  const now = useContext(NowCtx);
  if (now === null || now < START || now > END) return null;
  return (
    <span className="nowseg" style={{ left: xOf(now) }} aria-hidden={!label}>
      {label && <span className="nowseg__label">Now {fromMin(now)}</span>}
    </span>
  );
}
const START = DAY_VIEW.startHour * 60;
const END = DAY_VIEW.endHour * 60;
const PX = DAY_VIEW.hourWidth / 60;
const TIMELINE_W = (END - START) * PX;
const xOf = (min: number) => (Math.max(START, Math.min(END, min)) - START) * PX;
const snap = (min: number) => Math.round(min / DAY_VIEW.snapMin) * DAY_VIEW.snapMin;

/** Greedy lane assignment for overlapping bars. */
function lanes(tours: Tour[]) {
  const ends: number[] = [];
  const lane = new Map<string, number>();
  for (const t of [...tours].sort((a, b) => toMin(a.start!) - toMin(b.start!))) {
    const s = toMin(t.start!);
    let i = ends.findIndex((e) => e <= s);
    if (i === -1) i = ends.length;
    ends[i] = toMin(t.end ?? t.start!) + (t.status === 'delayed' ? t.delayMin ?? 0 : 0);
    lane.set(t.id, i);
  }
  return { lane, count: Math.max(1, ends.length) };
}

function freeGaps(tours: Tour[]) {
  const busy = tours
    .filter((t) => t.start && t.end && isActive(t))
    .map((t) => [toMin(t.start!), toMin(t.end!) + (t.delayMin ?? 0)] as const)
    .sort((a, b) => a[0] - b[0]);
  if (!busy.length) return [];
  const gaps: [number, number][] = [];
  let cursor = START;
  for (const [s, e] of busy) {
    if (s - cursor >= DAY_VIEW.minFreeGapMin) gaps.push([cursor, s]);
    cursor = Math.max(cursor, e);
  }
  if (END - cursor >= DAY_VIEW.minFreeGapMin) gaps.push([cursor, END]);
  return gaps;
}

const TourBar = memo(function TourBar({ tour, lane, laneCount }: { tour: Tour; lane: number; laneCount: number }) {
  const ctx = usePlannerCtx();
  const { draggable, dragging, onDragStart, onDragEnd } = useTourDrag(tour);
  const s = toMin(tour.start!);
  const e = toMin(tour.end ?? fromMin(s + 60));
  const left = xOf(s);
  const width = Math.max(28, xOf(e) - left);
  const delayW = tour.status === 'delayed' && tour.delayMin ? xOf(e + tour.delayMin) - xOf(e) : 0;
  const status = TOUR_STATUS[tour.status];
  const errors = tourIssues(ctx.idx, tour.id).filter((i) => i.severity === 'error');
  const eta = etaLabel(tour);
  const top = `calc(4px + (100% - 8px) / ${laneCount} * ${lane})`;
  const height = `calc((100% - 8px) / ${laneCount} - ${laneCount > 1 ? 2 : 0}px)`;
  const tall = ctx.density === 'comfortable' && laneCount === 1 && width > 220;

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        className={[
          'tbar',
          ctx.selection.has(tour.id) ? 'is-selected' : '',
          dragging ? 'is-dragging' : '',
          errors.length ? 'has-error' : '',
          tour.status === 'cancelled' ? 'is-cancelled' : '',
          tour.status === 'completed' ? 'is-completed' : '',
          ctx.matches?.has(tour.id) ? 'is-match' : '',
          delayW ? 'has-delay' : '',
        ].join(' ')}
        style={{ left, width, top, height, ['--status' as string]: status.color }}
        draggable={draggable}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onClick={(ev) => {
          ev.stopPropagation();
          ctx.onTourClick(tour, ev);
        }}
        onKeyDown={(ev) => ev.key === 'Enter' && ctx.onTourClick(tour, ev as never)}
        data-tip={`${tour.id} · ${routeFull(tour) || 'Route to fill in'} · ${timeLabel(tour)} · ${status.label}${eta ? ` · ETA ${eta}` : ''}${errors.length ? `\n${errors.map((i) => i.message).join('\n')}` : ''}`}
        aria-label={`${tour.id}, ${routeLabel(tour)}, ${timeLabel(tour)}, ${status.label}`}
      >
        <span className="tbar__row">
          <span className="tbar__time">{tour.start ? `${tour.start} – ${tour.end ?? ''}` : 'All day'}</span>
          {errors.length > 0 && <TriangleAlert size={13} strokeWidth={2.4} style={{ color: SEVERITY.error.color, flex: 'none' }} aria-hidden />}
          <span className="tbar__status">
            <status.icon size={12} strokeWidth={2.4} aria-hidden />
            {status.label}
            {eta ? ` · ETA ${eta}` : ''}
          </span>
        </span>
        {tall ? (
          <span className="tbar__row tbar__row--meta">
            <span className="tbar__route">{routeLabel(tour) || 'Route to fill in'}</span>
            <VehicleLine tour={tour} />
          </span>
        ) : (
          laneCount === 1 && (
            <span className="tbar__row tbar__row--meta">
              <span className="tbar__route">{routeLabel(tour) || 'Route to fill in'}</span>
            </span>
          )
        )}
      </div>
      {delayW > 0 && (
        <div className="tbar-delay" style={{ left: left + width, width: delayW, top, height }} data-tip={`Delayed ${tour.delayMin} min · ETA ${eta}`}>
          {delayW > 64 && <span>ETA {eta}</span>}
        </div>
      )}
    </>
  );
});

function useTimelineDrop(driverId: string | null, date: string) {
  const ctx = usePlannerCtx();
  const drop = useDropTarget(driverId, date);
  const [ghost, setGhost] = useState<{ min: number; dur: number } | null>(null);
  const minAt = (e: { clientX: number; currentTarget: EventTarget }) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return snap(START + (e.clientX - r.left) / PX);
  };
  if (ctx.readOnly) return { drop, ghost: null, handlers: {}, minAt };
  const handlers = {
    onDragOver: (e: DragEvent) => {
      drop.handlers.onDragOver?.(e);
      const st = useDnd.getState();
      if (!st.ids || !st.check?.ok) return setGhost(null);
      const t = ctx.idx.tourById.get(st.ids[0]);
      const dur = t?.start && t.end ? toMin(t.end) - toMin(t.start) : DAY_VIEW.defaultDurationMin;
      const min = Math.max(START, Math.min(END - 15, minAt(e) - Math.round(dur / 4 / 15) * 15));
      if (!ghost || ghost.min !== min) setGhost({ min, dur });
    },
    onDragLeave: () => {
      drop.handlers.onDragLeave?.();
    },
    onDrop: (e: DragEvent) => {
      e.preventDefault();
      const ids = useDnd.getState().ids;
      useDnd.getState().end();
      const g = ghost;
      setGhost(null);
      if (ids) ctx.drop(ids, driverId, date, g?.min ?? minAt(e));
    },
  };
  // The ghost is only shown while this row is the active drop target.
  return { drop, ghost: drop.check?.ok ? ghost : null, handlers, minAt };
}

function Ghost({ ghost }: { ghost: { min: number; dur: number } | null }) {
  if (!ghost) return null;
  return (
    <div className="tghost" style={{ left: xOf(ghost.min), width: Math.max(28, xOf(ghost.min + ghost.dur) - xOf(ghost.min)) }}>
      {fromMin(ghost.min)}
    </div>
  );
}

function AllDayCell({ driverId, date, tours, free }: { driverId: string | null; date: string; tours: Tour[]; free?: boolean }) {
  const ctx = usePlannerCtx();
  const drop = useDropTarget(driverId, date);
  return (
    <div
      className={`allday ${drop.check ? (drop.check.ok ? 'is-drop-ok' : 'is-drop-bad') : ''}`}
      {...drop.handlers}
      onDrop={(e) => {
        e.preventDefault();
        const ids = useDnd.getState().ids;
        useDnd.getState().end();
        if (ids) ctx.drop(ids, driverId, date, null);
      }}
    >
      {tours.length === 1 && <TourCard tour={tours[0]} />}
      {tours.length > 1 && <MultiTourChip tours={tours} onOpen={(r) => ctx.openCell(r, driverId, date)} />}
      {free && tours.length === 0 && <span className="allday__free">Free all day</span>}
    </div>
  );
}

const TimelineCell = memo(function TimelineCell({ driver, date }: { driver: Driver; date: string }) {
  const ctx = usePlannerCtx();
  const all = toursFor(ctx.idx, driver.id, date);
  const timed = all.filter((t) => t.start);
  const { lane, count } = useMemo(() => lanes(timed), [timed]);
  const absence = absenceOn(ctx.idx, driver.id, date);
  const doc = absence ? undefined : blockingDoc(driver, date);
  const gaps = useMemo(() => (absence || doc ? [] : freeGaps(all)), [all, absence, doc]);
  const { drop, ghost, handlers, minAt } = useTimelineDrop(driver.id, date);

  const create = (e: MouseEvent) => {
    if (ctx.readOnly || absence || doc) return;
    const s = Math.min(minAt(e), END - 60);
    ctx.onCreate({ driverId: driver.id, date, start: fromMin(s), end: fromMin(Math.min(s + DAY_VIEW.defaultDurationMin, 23 * 60 + 45)) });
  };

  return (
    <div
      className={[
        'timeline',
        absence ? 'is-absent' : '',
        doc ? 'is-blocked' : '',
        drop.check ? (drop.check.ok ? (drop.check.warning ? 'is-drop-warn' : 'is-drop-ok') : 'is-drop-bad') : '',
      ].join(' ')}
      style={{ width: TIMELINE_W }}
      onClick={create}
      {...handlers}
    >
      {(absence || doc) && (
        <span className="timeline__state">
          <DayStateLabel absence={absence} doc={doc} />
        </span>
      )}
      {gaps.map(([s, e]) => (
        <span key={s} className="gap" style={{ left: xOf(s), width: xOf(e) - xOf(s) }}>
          {xOf(e) - xOf(s) > 120 && <span>{`Free ${fromMin(s)}–${fromMin(e)}`}</span>}
        </span>
      ))}
      {timed.map((t) => (
        <TourBar key={t.id} tour={t} lane={lane.get(t.id) ?? 0} laneCount={count} />
      ))}
      <Ghost ghost={ghost} />
      <NowSeg />
      {drop.check && !drop.check.ok && <span className="drophint drophint--bad">{drop.check.reason}</span>}
      {drop.check?.ok && drop.check.warning && <span className="drophint drophint--warn">{drop.check.warning}</span>}
    </div>
  );
});

const DayRow = memo(function DayRow({ driver, date }: { driver: Driver; date: string }) {
  const ctx = usePlannerCtx();
  const untimed = toursFor(ctx.idx, driver.id, date).filter((t) => !t.start);
  const free = !absenceOn(ctx.idx, driver.id, date) && !blockingDoc(driver, date) && toursFor(ctx.idx, driver.id, date).filter(isActive).length === 0;
  return (
    <>
      <DriverCell driver={driver} tourCount={toursFor(ctx.idx, driver.id, date).filter((t) => t.status !== 'cancelled').length} />
      <AllDayCell driverId={driver.id} date={date} tours={untimed} free={free} />
      <TimelineCell driver={driver} date={date} />
    </>
  );
});

function UnassignedTimeline({ date, tours }: { date: string; tours: Tour[] }) {
  const { lane, count } = useMemo(() => lanes(tours), [tours]);
  const { drop, ghost, handlers } = useTimelineDrop(null, date);
  return (
    <div className={`timeline ${drop.check ? 'is-drop-ok' : ''}`} style={{ width: TIMELINE_W }} {...handlers}>
      {tours.map((t) => (
        <TourBar key={t.id} tour={t} lane={lane.get(t.id) ?? 0} laneCount={count} />
      ))}
      <Ghost ghost={ghost} />
      <NowSeg />
    </div>
  );
}

function OnRoadCell({ date, drivers }: { date: string; drivers: Driver[] }) {
  const ctx = usePlannerCtx();
  const hours = useMemo(() => {
    const out: number[] = [];
    for (let h = DAY_VIEW.startHour; h < DAY_VIEW.endHour; h++) {
      const m = h * 60 + 30;
      let n = 0;
      for (const d of drivers) if (toursFor(ctx.idx, d.id, date).some((t) => isActive(t) && t.start && t.end && toMin(t.start) <= m && toMin(t.end) + (t.delayMin ?? 0) > m)) n++;
      out.push(n);
    }
    return out;
  }, [ctx.idx, drivers, date]);
  const max = Math.max(1, ...hours);
  return (
    <div className="onroad" style={{ width: TIMELINE_W }}>
      {hours.map((n, i) => (
        <span key={i} className="onroad__h" style={{ width: DAY_VIEW.hourWidth }} data-tip={`${String(DAY_VIEW.startHour + i).padStart(2, '0')}:00–${String(DAY_VIEW.startHour + i + 1).padStart(2, '0')}:00 · ${n} drivers on the road`}>
          <span className="onroad__bar" style={{ height: `${(n / max) * 100}%` }} />
          <span className="onroad__n">{n}</span>
        </span>
      ))}
      <NowSeg />
    </div>
  );
}

interface Props {
  date: string;
  items: RowItem[];
  allDrivers: Driver[];
  unassigned: Tour[];
  showSummary: boolean;
  showUnassigned: boolean;
  autoHeight: boolean;
  onToggleGroup: (key: string) => void;
}

export function DayGrid({ date, items, allDrivers, unassigned, showSummary, showUnassigned, autoHeight, onToggleGroup }: Props) {
  const ctx = usePlannerCtx();
  const scrollRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const [headH, setHeadH] = useState(0);
  const [now, setNow] = useState(nowMin());
  const rowH = DENSITY[ctx.density].rowHeight;
  const isToday = date === ctx.today;

  useEffect(() => {
    const t = window.setInterval(() => setNow(nowMin()), 30000);
    return () => window.clearInterval(t);
  }, []);

  useLayoutEffect(() => {
    const el = headRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHeadH(el.offsetHeight));
    ro.observe(el);
    setHeadH(el.offsetHeight);
    return () => ro.disconnect();
  }, []);

  // Start scrolled so "now" (or 06:00) is in view.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollLeft = Math.max(0, xOf(isToday ? now - 120 : 6 * 60));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const v = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (i) => (items[i].type === 'group' ? GROUP_ROW_HEIGHT : rowH),
    overscan: 6,
    scrollMargin: headH,
    getItemKey: (i) => (items[i].type === 'group' ? `g:${(items[i] as { key: string }).key}` : (items[i] as { driver: Driver }).driver.id),
  });
  useEffect(() => v.measure(), [rowH, items, v]);

  const timedU = unassigned.filter((t) => t.start);
  const untimedU = unassigned.filter((t) => !t.start);
  const uLanes = lanes(timedU).count;
  const cols = `${WEEK_VIEW.driverColWidth}px ${ALLDAY_W}px ${TIMELINE_W}px`;
  const hours = Array.from({ length: DAY_VIEW.endHour - DAY_VIEW.startHour }, (_, i) => DAY_VIEW.startHour + i);
  const summary = useMemo(() => daySummary(ctx.idx, allDrivers, date), [ctx.idx, allDrivers, date]);
  const driverCount = useMemo(() => items.filter((i) => i.type === 'driver').length, [items]);

  return (
    <NowCtx.Provider value={isToday ? now : null}>
    <div
      ref={scrollRef}
      className={`grid-scroll grid-scroll--day ${autoHeight ? 'grid-scroll--auto' : ''}`}
      style={{ ['--cols' as string]: cols, ['--row-h' as string]: `${rowH}px`, ['--allday-w' as string]: `${ALLDAY_W}px` }}
      role="grid"
    >
      <div className="grid-inner" style={{ width: WEEK_VIEW.driverColWidth + ALLDAY_W + TIMELINE_W }}>
        <div ref={headRef} className="grid-head">
          <div className="grow-days" role="row">
            <div className="hcell hcell--corner">
              Drivers <span className="hcell__count">{driverCount}</span>
            </div>
            <div className="hcell hcell--allday">All day</div>
            <div className="hours" style={{ width: TIMELINE_W }}>
              {hours.map((h) => (
                <span key={h} className="hours__h" style={{ width: DAY_VIEW.hourWidth }}>
                  {String(h).padStart(2, '0')}:00
                </span>
              ))}
              <NowSeg label />
            </div>
          </div>
          {showSummary && (
            <div className="grow-summary" role="row">
              <div className="hcell hcell--corner hcell--label">On the road</div>
              <div className="hcell hcell--allday hcell--summary">
                <SummaryCell s={summary} total={allDrivers.length} />
              </div>
              <OnRoadCell date={date} drivers={allDrivers} />
            </div>
          )}
          {showUnassigned && (
            <div className="grow-unassigned grow-unassigned--day" role="row" style={{ minHeight: Math.max(rowH + 8, uLanes * 30 + 10) }}>
              <UnassignedHead count={unassigned.length} expanded={false} onToggle={() => {}} canExpand={false} />
              <AllDayCell driverId={null} date={date} tours={untimedU} />
              <UnassignedTimeline date={date} tours={timedU.length ? timedU : EMPTY_TOURS} />
            </div>
          )}
        </div>

        <div className="grid-body" style={{ height: v.getTotalSize() }}>
          <div className="hourlines" style={{ left: WEEK_VIEW.driverColWidth + ALLDAY_W, width: TIMELINE_W, ['--hw' as string]: `${DAY_VIEW.hourWidth}px` }} aria-hidden />
          {v.getVirtualItems().map((vi) => {
            const it = items[vi.index];
            return (
              <div key={vi.key} className={`grid-row ${it.type === 'group' ? 'grid-row--group' : ''}`} role="row" style={{ transform: `translateY(${vi.start - headH}px)`, height: vi.size - (it.type === 'group' ? 0 : ROW_GAP) }}>
                {it.type === 'group' ? <GroupRow item={it} onToggle={() => onToggleGroup(it.key)} /> : <DayRow driver={it.driver} date={date} />}
              </div>
            );
          })}
        </div>

      </div>
    </div>
    </NowCtx.Provider>
  );
}

