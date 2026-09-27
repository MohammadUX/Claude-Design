import { useVirtualizer } from '@tanstack/react-virtual';
import { Plus } from 'lucide-react';
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import { ABSENCE, DENSITY, WEEK_VIEW } from '../config';
import { useDnd } from '../actions';
import { fmtDayNum, fmtMedium, fmtWeekday, isWeekend } from '../date';
import { absenceOn, blockingDoc, daySummary, docLabel, EMPTY_TOURS, toursFor } from '../selectors';
import type { Driver, Tour } from '../types';
import { usePlannerCtx } from './context';
import { daySpans, DriverCell, GROUP_ROW_HEIGHT, GroupRow, ROW_GAP, SpanBar, UnassignedHead, type RowItem } from './rows';
import { MultiTourChip, TourCard } from './TourCard';

interface Props {
  days: string[];
  items: RowItem[];
  allDrivers: Driver[];
  unassigned: Map<string, Tour[]>;
  showSummary: boolean;
  showUnassigned: boolean;
  autoHeight: boolean;
  onToggleGroup: (key: string) => void;
}

/** Drop-target behaviour shared by driver cells and unassigned cells. */
export function useDropTarget(driverId: string | null, date: string) {
  const ctx = usePlannerCtx();
  const key = `${driverId ?? 'U'}|${date}`;
  const check = useDnd((s) => (s.overKey === key ? s.check : null));
  const active = useDnd((s) => !!s.ids);
  if (ctx.readOnly) return { key, check: null, active: false, handlers: {} };
  return {
    key,
    check,
    active,
    handlers: {
      onDragOver: (e: DragEvent) => {
        const st = useDnd.getState();
        if (!st.ids) return;
        const c = st.overKey === key && st.check ? st.check : ctx.checkDrop(st.ids, driverId, date);
        st.over(key, c);
        if (c.ok) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }
      },
      onDragLeave: () => useDnd.getState().leave(key),
      onDrop: (e: DragEvent) => {
        e.preventDefault();
        const ids = useDnd.getState().ids;
        useDnd.getState().end();
        if (ids) ctx.drop(ids, driverId, date);
      },
    },
  };
}

function DropHint({ check }: { check: ReturnType<typeof useDropTarget>['check'] }) {
  if (!check) return null;
  if (!check.ok) return <span className="drophint drophint--bad">{check.reason}</span>;
  if (check.warning) return <span className="drophint drophint--warn">{check.warning}</span>;
  return <span className="drophint drophint--ok">Drop to assign</span>;
}

const WeekCell = memo(function WeekCell({ driver, date, isToday }: { driver: Driver; date: string; isToday: boolean }) {
  const ctx = usePlannerCtx();
  const tours = toursFor(ctx.idx, driver.id, date);
  const absence = absenceOn(ctx.idx, driver.id, date);
  const doc = absence ? undefined : blockingDoc(driver, date);
  const drop = useDropTarget(driver.id, date);
  const canCreate = !ctx.readOnly && !absence && !doc;

  return (
    <div
      className={[
        'wcell',
        isToday ? 'is-today' : '',
        isWeekend(date) ? 'is-weekend' : '',
        absence ? 'is-absent' : '',
        doc ? 'is-blocked' : '',
        drop.check ? (drop.check.ok ? (drop.check.warning ? 'is-drop-warn' : 'is-drop-ok') : 'is-drop-bad') : '',
        tours.length ? 'has-tours' : '',
      ].join(' ')}
      data-tip={absence ? `${ABSENCE[absence.reason].label}${absence.note ? ` · ${absence.note}` : ''}` : doc ? `Can’t drive: ${docLabel(doc)} expired` : undefined}
      {...drop.handlers}
    >
      {tours.length === 1 && <TourCard tour={tours[0]} />}
      {tours.length > 1 && <MultiTourChip tours={tours} onOpen={(r) => ctx.openCell(r, driver.id, date)} />}
      {tours.length === 0 && canCreate && (
        <button
          className="wcell__add"
          onClick={() => ctx.onCreate({ driverId: driver.id, date })}
          aria-label={`New tour for ${driver.firstName} ${driver.lastName} on ${fmtMedium(date)}`}
        >
          <Plus size={16} />
        </button>
      )}
      <DropHint check={drop.check} />
    </div>
  );
});

const DriverRow = memo(function DriverRow({ driver, days, today }: { driver: Driver; days: string[]; today: string }) {
  const ctx = usePlannerCtx();
  const spans = daySpans(ctx.idx, driver, days);
  const tourCount = days.reduce((n, d) => n + toursFor(ctx.idx, driver.id, d).filter((t) => t.status !== 'cancelled').length, 0);
  return (
    <>
      <DriverCell driver={driver} tourCount={tourCount} />
      {days.map((d) => (
        <WeekCell key={d} driver={driver} date={d} isToday={d === today} />
      ))}
      {spans.map((sp) => (
        <SpanBar key={sp.from} span={sp} hasTours={days.slice(sp.from, sp.to + 1).some((d) => toursFor(ctx.idx, driver.id, d).length > 0)} />
      ))}
    </>
  );
});

function UnassignedCell({ date, tours, expanded, isToday }: { date: string; tours: Tour[]; expanded: boolean; isToday: boolean }) {
  const ctx = usePlannerCtx();
  const drop = useDropTarget(null, date);
  const shown = expanded ? tours : tours.slice(0, 1);
  const rest = tours.length - shown.length;
  return (
    <div
      className={[
        'wcell wcell--unassigned',
        isToday ? 'is-today' : '',
        expanded ? 'is-expanded' : '',
        drop.check ? (drop.check.ok ? 'is-drop-ok' : 'is-drop-bad') : '',
      ].join(' ')}
      {...drop.handlers}
    >
      <div className="wcell__stack">
        {shown.map((t) => (
          <TourCard key={t.id} tour={t} />
        ))}
      </div>
      {rest > 0 && (
        <button className="wcell__more" onClick={(e) => ctx.openCell(e.currentTarget.getBoundingClientRect(), null, date)}>
          +{rest} more
        </button>
      )}
      {tours.length === 0 && !ctx.readOnly && (
        <button className="wcell__add" onClick={() => ctx.onCreate({ date })} aria-label={`New unassigned tour on ${fmtMedium(date)}`}>
          <Plus size={16} />
        </button>
      )}
      {drop.check && <span className="drophint drophint--ok">Move to Unassigned</span>}
    </div>
  );
}

export function WeekGrid({ days, items, allDrivers, unassigned, showSummary, showUnassigned, autoHeight, onToggleGroup }: Props) {
  const ctx = usePlannerCtx();
  const scrollRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const [headH, setHeadH] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const rowH = DENSITY[ctx.density].rowHeight;

  useLayoutEffect(() => {
    const el = headRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHeadH(el.offsetHeight));
    ro.observe(el);
    setHeadH(el.offsetHeight);
    return () => ro.disconnect();
  }, []);

  const v = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (i) => (items[i].type === 'group' ? GROUP_ROW_HEIGHT : rowH),
    overscan: 6,
    scrollMargin: headH,
    getItemKey: (i) => (items[i].type === 'group' ? `g:${(items[i] as { key: string }).key}` : (items[i] as { driver: Driver }).driver.id),
  });
  useEffect(() => v.measure(), [rowH, items, v]);

  // Memoized: the grid re-renders on every scroll frame.
  const summaries = useMemo(() => days.map((d) => daySummary(ctx.idx, allDrivers, d)), [ctx.idx, allDrivers, days]);
  const driverCount = useMemo(() => items.filter((i) => i.type === 'driver').length, [items]);
  const unassignedTotal = days.reduce((n, d) => n + (unassigned.get(d)?.length ?? 0), 0);
  const maxUnassigned = Math.max(0, ...days.map((d) => unassigned.get(d)?.length ?? 0));
  const cols = `${WEEK_VIEW.driverColWidth}px repeat(${days.length}, minmax(${WEEK_VIEW.dayColMinWidth}px, 1fr))`;

  return (
    <div
      ref={scrollRef}
      className={`grid-scroll ${autoHeight ? 'grid-scroll--auto' : ''}`}
      style={{ ['--cols' as string]: cols, ['--row-h' as string]: `${rowH}px` }}
      role="grid"
      aria-rowcount={items.length}
      aria-colcount={days.length + 1}
    >
      <div className="grid-inner" style={{ minWidth: WEEK_VIEW.driverColWidth + days.length * WEEK_VIEW.dayColMinWidth }}>
        <div ref={headRef} className="grid-head">
          <div className="grow-days" role="row">
            <div className="hcell hcell--corner">
              Drivers <span className="hcell__count">{driverCount}</span>
            </div>
            {days.map((d, i) => (
              <button
                key={d}
                role="columnheader"
                className={`hcell hcell--day ${d === ctx.today ? 'is-today' : ''} ${isWeekend(d) ? 'is-weekend' : ''}`}
                onClick={() => ctx.openDay(d)}
                data-tip={`${summaries[i].busy} working · ${summaries[i].free} free · ${summaries[i].absent} absent${summaries[i].blocked ? ` · ${summaries[i].blocked} can’t drive` : ''}\nClick to see the day`}
              >
                <span className="hcell__top">
                  <span className="hcell__wd">{fmtWeekday(d)}</span>
                  <span className="hcell__num">{fmtDayNum(d)}</span>
                  {d === ctx.today && <span className="hcell__today">Today</span>}
                </span>
                {showSummary && (
                  <span className="hcell__sum">
                    <b>{summaries[i].busy}</b> working · <b className="is-free">{summaries[i].free}</b> free
                  </span>
                )}
              </button>
            ))}
          </div>
          {showUnassigned && (
            <div className={`grow-unassigned ${expanded ? 'is-expanded' : ''}`} role="row" style={{ ['--u-max' as string]: Math.min(maxUnassigned, 4) }}>
              <UnassignedHead count={unassignedTotal} expanded={expanded} onToggle={() => setExpanded((x) => !x)} canExpand={maxUnassigned > 1} />
              {days.map((d) => (
                <UnassignedCell key={d} date={d} tours={unassigned.get(d) ?? EMPTY_TOURS} expanded={expanded} isToday={d === ctx.today} />
              ))}
            </div>
          )}
        </div>

        <div className="grid-body" style={{ height: v.getTotalSize() }}>
          {v.getVirtualItems().map((vi) => {
            const it = items[vi.index];
            return (
              <div
                key={vi.key}
                className={`grid-row ${it.type === 'group' ? 'grid-row--group' : ''}`}
                role="row"
                aria-rowindex={vi.index + 1}
                style={{ transform: `translateY(${vi.start - headH}px)`, height: vi.size - (it.type === 'group' ? 0 : ROW_GAP) }}
              >
                {it.type === 'group' ? (
                  <GroupRow item={it} onToggle={() => onToggleGroup(it.key)} />
                ) : (
                  <DriverRow driver={it.driver} days={days} today={ctx.today} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
