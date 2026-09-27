import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CopyPlus,
  Layers,
  Phone,
  Plus,
  RefreshCw,
  Rows2,
  Rows3,
  Search,
  SearchX,
  Trash2,
  UserPlus,
  Users,
  X,
  CalendarPlus,
  CloudAlert,
  CalendarArrowUp,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { moveTours, useDnd } from '../actions';
import { ABSENCE, FILTERS, GROUP_BY, TOUR_STATUS, type Density, type FilterKey, type GroupBy } from '../config';
import { addDays, diffDays, fmtLong, fmtMedium, fmtRange, fmtShortDay, rangeDays, startOfWeek, todayISO } from '../date';
import {
  absenceOn,
  checkDrop,
  daySummary,
  driverAvailability,
  driverName,
  driverPeriodStats,
  getIndex,
  initials,
  isActive,
  matchesFilter,
  routeFull,
  routeLabel,
  timeLabel,
  toursFor,
} from '../selectors';
import { usePlannerStore } from '../store';
import type { Driver, Tour } from '../types';
import { Ctx, type PlannerCtx } from './context';
import { BoardCard, BoardView } from './BoardView';
import { DayGrid } from './DayGrid';
import { type RowItem } from './rows';
import { TourCard } from './TourCard';
import { TourPanel, type PanelState } from './TourPanel';
import { Avatar, DocList, Menu, Popover, Segmented, SmartSelect, Trunc } from './ui';
import { WeekGrid } from './WeekGrid';

/** 'board' = day cards per driver (default), 'day' = hour timeline, 'week' = 7-day grid. */
export type PlannerView = 'board' | 'day' | 'week';

export interface PlannerProps {
  /** Initial view. */
  view?: PlannerView;
  /** Anchor date (ISO). Defaults to today. */
  date?: string;
  /** Custom column range for the week view (1–14 days). Overrides the Mon–Sun week. */
  range?: { start: string; end: string };
  /** Compact density (default: comfortable on full page, compact in widgets). */
  compact?: boolean;
  /** Limit the number of driver rows (widget mode). Disables internal scrolling. */
  maxRows?: number;
  /** When set (with maxRows) shows an "Open planner →" link. */
  openPlannerHref?: string;
  /** Preset driver filter. */
  filter?: FilterKey;
  /** Hide all editing affordances (no drag, no create, panel read-only). */
  readOnly?: boolean;
  showHeader?: boolean;
  showToolbar?: boolean;
  showSummary?: boolean;
  showUnassigned?: boolean;
  /** Global keyboard shortcuts (← → T N Esc). Turn off for embedded widgets. */
  enableShortcuts?: boolean;
  /** Prefill for the search box. */
  initialSearch?: string;
  title?: string;
}

type Popup =
  | { kind: 'cell'; rect: DOMRect; driverId: string | null; date: string }
  | { kind: 'driver'; rect: DOMRect; driverId: string }
  | { kind: 'group'; rect: DOMRect }
  | { kind: 'filter'; rect: DOMRect }
  | { kind: 'bulk-assign'; rect: DOMRect }
  | { kind: 'unassigned'; rect: DOMRect }
  | null;

const isTyping = (el: EventTarget | null) => {
  const t = el as HTMLElement | null;
  return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
};

/** Where the tour's first day lands, given the day that was grabbed and the day it was dropped on. */
function shiftedDate(primary: Tour | undefined, dropDate: string) {
  const anchor = useDnd.getState().anchor;
  if (!primary || !anchor) return dropDate;
  return addDays(primary.date, diffDays(dropDate, anchor));
}

export function Planner({
  view: viewProp = 'board',
  date: dateProp,
  range,
  compact,
  maxRows,
  openPlannerHref,
  filter: filterProp = 'all',
  readOnly = false,
  showHeader = true,
  showToolbar = true,
  showSummary = true,
  showUnassigned = true,
  enableShortcuts = true,
  initialSearch = '',
  title = 'Planner',
}: PlannerProps) {
  const status = usePlannerStore((s) => s.status);
  const data = usePlannerStore((s) => s.data);
  const retry = usePlannerStore((s) => s.retry);
  const idx = getIndex(data);
  const today = todayISO();

  const [view, setView] = useState<PlannerView>(viewProp);
  const [anchor, setAnchor] = useState(dateProp ?? today);
  const [search, setSearch] = useState(initialSearch);
  const [filter, setFilter] = useState<FilterKey>(filterProp);
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [density, setDensity] = useState<Density>(compact === undefined ? 'comfortable' : compact ? 'compact' : 'comfortable');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [panel, setPanel] = useState<PanelState>(null);
  const [popup, setPopup] = useState<Popup>(null);
  const [pending, setPending] = useState<(() => void) | null>(null);
  const dirtyRef = useRef(false);
  const hoverTimer = useRef<number | undefined>(undefined);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => setView(viewProp), [viewProp]);
  useEffect(() => setFilter(filterProp), [filterProp]);
  useEffect(() => setSearch(initialSearch), [initialSearch]);
  useEffect(() => {
    if (dateProp) setAnchor(dateProp);
  }, [dateProp]);

  /* --------------------------------------------------------------- Period */
  const days = useMemo(() => {
    if (view !== 'week') return [anchor];
    if (range) return rangeDays(range.start, range.end).slice(0, 14);
    const s = startOfWeek(anchor);
    return rangeDays(s, addDays(s, 6));
  }, [view, anchor, range]);
  const focusDay = days.includes(today) ? today : days[0];

  const shift = useCallback((dir: -1 | 1) => setAnchor((a) => addDays(a, dir * (view !== 'week' ? 1 : range ? days.length : 7))), [view, range, days.length]);

  /* ------------------------------------------------------ Guarded actions */
  const guard = useCallback((fn: () => void) => {
    if (dirtyRef.current) setPending(() => fn);
    else fn();
  }, []);
  const closePanel = useCallback(() => guard(() => setPanel(null)), [guard]);
  const onDirtyChange = useCallback((d: boolean) => {
    dirtyRef.current = d;
  }, []);

  /* ------------------------------------------------------ Search & filter */
  const q = search.trim().toLowerCase();

  const stats = useMemo(() => new Map(data.drivers.map((d) => [d.id, driverPeriodStats(idx, d, days, today)])), [idx, data.drivers, days, today]);

  const matches = useMemo(() => {
    if (!q) return null;
    const set = new Set<string>();
    for (const date of days) {
      const dayTours = [...data.drivers.flatMap((d) => toursFor(idx, d.id, date)), ...(idx.unassigned.get(date) ?? [])];
      for (const t of dayTours) {
        const hay = [
          t.id,
          t.clientId && idx.clientById.get(t.clientId)?.name,
          t.tractorId && idx.tractorById.get(t.tractorId)?.plate,
          t.trailerId && idx.trailerById.get(t.trailerId)?.plate,
          routeFull(t),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (hay.includes(q) || hay.replace(/\s/g, '').includes(q.replace(/\s/g, ''))) set.add(t.id);
      }
    }
    return set;
  }, [q, days, data.drivers, idx]);

  const driverMatchesSearch = useCallback(
    (d: Driver) => {
      if (!q) return true;
      const plate = d.defaultTractorId ? idx.tractorById.get(d.defaultTractorId)?.plate ?? '' : '';
      const hay = `${d.firstName} ${d.lastName} ${plate} ${plate.replace(/\s/g, '')}`.toLowerCase();
      if (hay.includes(q)) return true;
      return days.some((date) => toursFor(idx, d.id, date).some((t) => matches?.has(t.id)));
    },
    [q, idx, days, matches],
  );

  const searched = useMemo(() => data.drivers.filter(driverMatchesSearch), [data.drivers, driverMatchesSearch]);

  const counts = useMemo(() => {
    const c = Object.fromEntries(FILTERS.map((f) => [f.key, 0])) as Record<FilterKey, number>;
    c.issues = 0;
    for (const d of searched) {
      const s = stats.get(d.id)!;
      for (const f of FILTERS) if (matchesFilter(s, f.key)) c[f.key]++;
      if (s.issues) c.issues++;
    }
    return c;
  }, [searched, stats]);

  const visible = useMemo(() => {
    const list = searched.filter((d) => matchesFilter(stats.get(d.id)!, filter));
    return maxRows ? list.slice(0, maxRows) : list;
  }, [searched, stats, filter, maxRows]);

  const items: RowItem[] = useMemo(() => {
    if (groupBy === 'none') return visible.map((driver) => ({ type: 'driver', driver }));
    const keyOf = (d: Driver) => {
      if (groupBy === 'depot') return idx.depotById.get(d.depotId)?.name ?? 'No depot';
      const tr = d.defaultTrailerId ? idx.trailerById.get(d.defaultTrailerId) : undefined;
      return tr ? tr.type : 'No default trailer';
    };
    const groups = new Map<string, Driver[]>();
    for (const d of visible) {
      const k = keyOf(d);
      groups.set(k, [...(groups.get(k) ?? []), d]);
    }
    const out: RowItem[] = [];
    [...groups.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([key, ds]) => {
        const busy = ds.filter((d) => toursFor(idx, d.id, focusDay).some(isActive)).length;
        out.push({ type: 'group', key, label: key, count: ds.length, busy, collapsed: collapsed.has(key) });
        if (!collapsed.has(key)) ds.forEach((driver) => out.push({ type: 'driver', driver }));
      });
    return out;
  }, [visible, groupBy, collapsed, idx, focusDay]);

  const unassigned = useMemo(() => {
    const m = new Map<string, Tour[]>();
    for (const d of days) {
      const list = (idx.unassigned.get(d) ?? []).filter((t) => t.status !== 'cancelled' && (!matches || matches.has(t.id)));
      if (list.length) m.set(d, list);
    }
    return m;
  }, [days, idx, matches]);

  const periodUnassigned = days.reduce((n, d) => n + (idx.unassigned.get(d) ?? []).filter(isActive).length, 0);
  const periodTours = useMemo(() => data.tours.filter((t) => days.includes(t.date)).length, [data.tours, days]);

  /* ------------------------------------------------------------- Actions */
  const openTour = useCallback((t: Tour) => guard(() => setPanel({ mode: 'edit', id: t.id })), [guard]);
  const onCreate = useCallback(
    (prefill: Partial<Tour>) => {
      if (readOnly) return;
      guard(() => setPanel({ mode: 'new', prefill: { date: focusDay, ...prefill } }));
    },
    [guard, readOnly, focusDay],
  );

  const onTourClick = useCallback(
    (t: Tour, e: MouseEvent) => {
      if (!readOnly && (e.shiftKey || e.metaKey || e.ctrlKey)) {
        setSelection((s) => {
          const n = new Set(s);
          if (n.has(t.id)) n.delete(t.id);
          else n.add(t.id);
          return n;
        });
        return;
      }
      setSelection(new Set());
      setPopup(null);
      openTour(t);
    },
    [openTour, readOnly],
  );

  const hoverDriver = useCallback((d: Driver | null, rect?: DOMRect) => {
    window.clearTimeout(hoverTimer.current);
    if (d && rect) hoverTimer.current = window.setTimeout(() => setPopup((p) => (p && p.kind !== 'driver' ? p : { kind: 'driver', rect, driverId: d.id })), 450);
    else hoverTimer.current = window.setTimeout(() => setPopup((p) => (p?.kind === 'driver' ? null : p)), 200);
  }, []);

  const ctx: PlannerCtx = useMemo(
    () => ({
      idx,
      today,
      density,
      readOnly,
      selection,
      matches,
      onTourClick,
      onCreate,
      openCell: (rect, driverId, date) => setPopup({ kind: 'cell', rect, driverId, date }),
      hoverDriver,
      checkDrop: (ids, driverId, date) => {
        const tours = ids.map((id) => idx.tourById.get(id)).filter(Boolean) as Tour[];
        return checkDrop(idx, tours, driverId ?? undefined, shiftedDate(tours[0], date));
      },
      drop: (ids, driverId, date, startMin) => {
        setSelection(new Set());
        setPopup(null);
        moveTours(ids, { driverId, date: shiftedDate(idx.tourById.get(ids[0]), date), startMin });
      },
      openDay: (date) => {
        setAnchor(date);
        setView('day');
      },
    }),
    [idx, today, density, readOnly, selection, matches, onTourClick, onCreate, hoverDriver],
  );

  /* ------------------------------------------------------------ Keyboard */
  useEffect(() => {
    if (!enableShortcuts) return;
    const onKey = (e: KeyboardEvent) => {
      if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'ArrowLeft') shift(-1);
      else if (e.key === 'ArrowRight') shift(1);
      else if (e.key.toLowerCase() === 't') setAnchor(todayISO());
      else if (e.key.toLowerCase() === 'n' && !readOnly) {
        e.preventDefault();
        onCreate({ date: focusDay });
      } else if (e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'Escape' && !panel && !document.querySelector('.popover')) setSelection(new Set());
      else return;
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enableShortcuts, shift, onCreate, focusDay, readOnly, panel]);

  /* --------------------------------------------------------------- Bulk */
  const selected = [...selection].filter((id) => idx.tourById.has(id));
  const bulk = {
    copy: () => {
      usePlannerStore.getState().copyTours(selected, [1], `${selected.length} tour${selected.length > 1 ? 's' : ''} copied to next day`);
      setSelection(new Set());
    },
    remove: () => {
      usePlannerStore.getState().deleteTours(selected);
      setSelection(new Set());
    },
    moveTo: (date: string) => {
      moveTours(selected, { date });
      setSelection(new Set());
    },
    assign: (driverId: string | undefined) => {
      moveTours(selected, { driverId: driverId ?? null, date: idx.tourById.get(selected[0])!.date });
      setSelection(new Set());
      setPopup(null);
    },
  };
  const bulkDate = useRef<HTMLInputElement>(null);

  /* ------------------------------------------------------------ Render */
  const daySum = useMemo(() => daySummary(idx, data.drivers, focusDay), [idx, data.drivers, focusDay]);
  const periodLabel = view !== 'week' ? fmtLong(anchor) : fmtRange(days[0], days.at(-1)!);
  const isCurrent = days.includes(today);
  const loading = status === 'loading';
  const noDrivers = status === 'ready' && data.drivers.length === 0;
  const noResults = status === 'ready' && !noDrivers && visible.length === 0;
  const noTours = status === 'ready' && !noDrivers && periodTours === 0;
  const widget = !!maxRows;

  return (
    <Ctx.Provider value={ctx}>
      <section className={`planner ${widget ? 'planner--widget' : ''} density-${density}`} aria-label={title}>
        {showHeader && (
          <header className="phead">
            <div className="phead__title">
              <h1>{title}</h1>
              <p className="phead__sub" aria-live="polite">
                {status === 'ready' && !noDrivers ? (
                  <>
                    <b>{daySum.busy}</b> of {data.drivers.length} drivers working {focusDay === today ? 'today' : fmtMedium(focusDay)}
                    <span className="dotsep"> · </span>
                    <button className={`phead__link ${periodUnassigned ? 'is-alert' : ''}`} onClick={(e) => setPopup({ kind: 'unassigned', rect: e.currentTarget.getBoundingClientRect() })} aria-haspopup="dialog">
                      <b>{periodUnassigned}</b> tour{periodUnassigned === 1 ? '' : 's'} waiting for a driver
                    </button>
                  </>
                ) : (
                  'Who drives what, and what still needs a driver.'
                )}
              </p>
            </div>

            <div className="phead__controls">
              <div className="datenav">
                <button className="iconbtn" onClick={() => shift(-1)} aria-label={`Previous ${view === "week" ? "week" : "day"}`} data-tip={`Previous ${view === "week" ? "week" : "day"} (←)`}>
                  <ChevronLeft size={18} />
                </button>
                <button className={`btn btn--ghost btn--sm ${isCurrent ? 'is-current' : ''}`} onClick={() => setAnchor(todayISO())} data-tip="Go to today (T)">
                  Today
                </button>
                <button className="iconbtn" onClick={() => shift(1)} aria-label={`Next ${view === "week" ? "week" : "day"}`} data-tip={`Next ${view === "week" ? "week" : "day"} (→)`}>
                  <ChevronRight size={18} />
                </button>
                <label className="datenav__picker" data-tip="Pick a date">
                  <CalendarDays size={16} aria-hidden />
                  <span>{periodLabel}</span>
                  <input
                    type="date"
                    value={anchor}
                    aria-label="Pick a date"
                    onChange={(e) => e.target.value && setAnchor(e.target.value)}
                    onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
                  />
                </label>
              </div>
              <Segmented
                label="View"
                value={view}
                onChange={setView}
                options={[
                  { value: 'board', label: 'Day', tip: 'Tours per driver as cards' },
                  { value: 'day', label: 'Timeline', tip: 'Hour by hour' },
                  { value: 'week', label: 'Week' },
                ]}
              />
              {!readOnly && (
                <button className="btn btn--primary" onClick={() => onCreate({ date: focusDay })} data-tip="New tour (N)">
                  <Plus size={16} strokeWidth={2.5} /> New tour
                </button>
              )}
            </div>
          </header>
        )}

        {showToolbar && !noDrivers && status !== 'error' && (
          <div className="toolbar">
            <div className="search">
              <Search size={15} aria-hidden />
              <input ref={searchRef} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search driver, city, plate, client, tour ID" aria-label="Search driver, city, plate, client or tour ID" />
              {search ? (
                <button className="iconbtn iconbtn--sm" onClick={() => setSearch('')} aria-label="Clear search">
                  <X size={14} />
                </button>
              ) : (
                <kbd>/</kbd>
              )}
            </div>
            <div className="chips" role="radiogroup" aria-label="Show drivers">
              {(
                [
                  { key: 'all', label: 'All' },
                  { key: 'busy', label: 'Working' },
                  { key: 'available', label: 'Available' },
                  { key: 'absent', label: 'Absent' },
                  { key: 'issues', label: 'Needs attention', dot: true },
                ] as { key: FilterKey; label: string; dot?: boolean }[]
              ).map((f) => (
                <button key={f.key} role="radio" aria-checked={filter === f.key} className={`chip ${filter === f.key ? 'is-active' : ''}`} onClick={() => setFilter(f.key)}>
                  {f.dot && <span className="chip__dot" aria-hidden />}
                  {f.label}
                  <span className="chip__count">{loading ? '–' : f.key === 'all' ? searched.length : counts[f.key]}</span>
                </button>
              ))}
            </div>
            <span className="toolbar__spacer" />
            <button className="btn btn--ghost btn--sm" onClick={(e) => setPopup({ kind: 'group', rect: e.currentTarget.getBoundingClientRect() })} aria-haspopup="menu">
              <Layers size={15} /> Group: {GROUP_BY.find((g) => g.key === groupBy)!.label}
            </button>
            <Segmented
              label="Density"
              size="sm"
              value={density}
              onChange={setDensity}
              options={[
                { value: 'compact', label: <Rows3 size={15} aria-label="Compact" />, tip: 'Compact rows' },
                { value: 'comfortable', label: <Rows2 size={15} aria-label="Comfortable" />, tip: 'Comfortable rows' },
              ]}
            />
          </div>
        )}

        <div className="pbody">
          {loading && <Skeleton />}
          {status === 'error' && (
            <EmptyState
              icon={CloudAlert}
              tone="error"
              title="We couldn’t load the planner"
              text="The connection to the server was interrupted. Your changes are safe — try again."
              action={
                <button className="btn btn--primary" onClick={retry}>
                  <RefreshCw size={15} /> Retry
                </button>
              }
            />
          )}
          {noDrivers && (
            <EmptyState
              icon={Users}
              title="No drivers yet"
              text="Add your drivers, tractors and semi-trailers to start planning tours."
              action={
                <a className="btn btn--primary" href="#drivers">
                  <UserPlus size={15} /> Add drivers
                </a>
              }
            />
          )}
          {status === 'ready' && !noDrivers && (
            <>
              {noTours && !noResults && (
                <div className="banner" role="status">
                  <CalendarPlus size={16} />
                  <span>
                    <b>No tours planned {view !== 'week' ? 'this day' : 'in this period'}.</b> Click any empty cell, drag from Unassigned, or create one.
                  </span>
                  {!readOnly && (
                    <button className="btn btn--primary btn--sm" onClick={() => onCreate({ date: focusDay })}>
                      <Plus size={14} /> New tour
                    </button>
                  )}
                </div>
              )}
              {noResults ? (
                <EmptyState
                  icon={SearchX}
                  title="No drivers match"
                  text={`Nothing found for ${q ? `“${search}”` : 'this filter'}${filter !== 'all' ? ` with filter “${FILTERS.find((f) => f.key === filter)!.label}”` : ''}.`}
                  action={
                    <button
                      className="btn btn--secondary"
                      onClick={() => {
                        setSearch('');
                        setFilter('all');
                      }}
                    >
                      Clear search & filters
                    </button>
                  }
                />
              ) : view === 'board' ? (
                <BoardView
                  date={anchor}
                  items={items}
                  unassigned={unassigned.get(anchor) ?? []}
                  showUnassigned={false}
                  autoHeight={widget}
                  onToggleGroup={(k) => setCollapsed((c) => new Set(c.has(k) ? [...c].filter((x) => x !== k) : [...c, k]))}
                />
              ) : view === 'week' ? (
                <WeekGrid
                  days={days}
                  items={items}
                  allDrivers={data.drivers}
                  unassigned={unassigned}
                  showSummary={showSummary}
                  showUnassigned={showUnassigned}
                  autoHeight={widget}
                  onToggleGroup={(k) => setCollapsed((c) => new Set(c.has(k) ? [...c].filter((x) => x !== k) : [...c, k]))}
                />
              ) : (
                <DayGrid
                  date={anchor}
                  items={items}
                  allDrivers={data.drivers}
                  unassigned={unassigned.get(anchor) ?? []}
                  showSummary={false}
                  showUnassigned={showUnassigned}
                  autoHeight={widget}
                  onToggleGroup={(k) => setCollapsed((c) => new Set(c.has(k) ? [...c].filter((x) => x !== k) : [...c, k]))}
                />
              )}
              {!noResults && !widget && <Legend />}
              {widget && openPlannerHref && (
                <a className="planner__open" href={openPlannerHref}>
                  Open planner <ArrowRight size={14} />
                </a>
              )}
            </>
          )}
        </div>

        {/* Bulk actions */}
        {selected.length > 0 && !readOnly && (
          <div className="bulkbar" role="toolbar" aria-label="Bulk actions">
            <span className="bulkbar__count">
              <b>{selected.length}</b> selected
            </span>
            <button className="btn btn--ghost btn--sm" onClick={(e) => setPopup({ kind: 'bulk-assign', rect: e.currentTarget.getBoundingClientRect() })}>
              <UserPlus size={15} /> Assign
            </button>
            <label className="btn btn--ghost btn--sm bulkbar__date">
              <CalendarArrowUp size={15} /> Move to…
              <input
                ref={bulkDate}
                type="date"
                aria-label="Move selected tours to date"
                onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
                onChange={(e) => e.target.value && bulk.moveTo(e.target.value)}
              />
            </label>
            <button className="btn btn--ghost btn--sm" onClick={bulk.copy}>
              <CopyPlus size={15} /> Copy to next day
            </button>
            <button className="btn btn--ghost btn--sm is-danger" onClick={bulk.remove}>
              <Trash2 size={15} /> Delete
            </button>
            <button className="iconbtn iconbtn--sm" onClick={() => setSelection(new Set())} aria-label="Clear selection" data-tip="Clear selection (Esc)">
              <X size={15} />
            </button>
          </div>
        )}

        {/* Popovers */}
        {popup?.kind === 'unassigned' && (() => {
          const list = days.flatMap((d) => unassigned.get(d) ?? []);
          return (
            <Popover anchor={popup.rect} onClose={() => setPopup(null)} className="upop" placement="bottom-start">
              <header className="upop__head">
                <div>
                  <h3>
                    Waiting for a driver <span className="upop__count">{list.length}</span>
                  </h3>
                  <p>{view === 'week' ? fmtRange(days[0], days.at(-1)!) : fmtLong(anchor)}</p>
                </div>
                <button className="iconbtn iconbtn--sm" onClick={() => setPopup(null)} aria-label="Close">
                  <X size={16} />
                </button>
              </header>
              {list.length === 0 ? (
                <p className="upop__empty">Every tour has a driver.</p>
              ) : (
                <>
                  <p className="upop__hint">Drag a card onto a driver, or click it to choose one.</p>
                  <div className="upop__list">
                    {list.map((t) => (
                      <BoardCard key={t.id} tour={t} date={t.date} />
                    ))}
                  </div>
                </>
              )}
              {!readOnly && (
                <footer className="upop__foot">
                  <button
                    className="btn btn--secondary btn--sm"
                    onClick={() => {
                      setPopup(null);
                      onCreate({ date: focusDay });
                    }}
                  >
                    <Plus size={14} /> New tour without driver
                  </button>
                </footer>
              )}
            </Popover>
          );
        })()}
        {popup?.kind === 'cell' && (
          <Popover anchor={popup.rect} onClose={() => setPopup(null)} className="cellpop" placement="bottom-start">
            <div className="cellpop__head">
              <b>{popup.driverId ? driverName(idx.driverById.get(popup.driverId)) : 'Unassigned'}</b>
              <span>{fmtMedium(popup.date)}</span>
            </div>
            <div className="cellpop__list">
              {(popup.driverId ? toursFor(idx, popup.driverId, popup.date) : unassigned.get(popup.date) ?? []).map((t) => (
                <TourCard key={t.id} tour={t} full />
              ))}
            </div>
            {!readOnly && (
              <button className="btn btn--ghost btn--sm" onClick={() => { setPopup(null); onCreate({ driverId: popup.driverId ?? undefined, date: popup.date }); }}>
                <Plus size={14} /> Add tour
              </button>
            )}
          </Popover>
        )}
        {popup?.kind === 'driver' && (
          <DriverQuickCard
            driverId={popup.driverId}
            rect={popup.rect}
            days={view !== 'week' ? rangeDays(startOfWeek(anchor), addDays(startOfWeek(anchor), 6)) : days}
            onClose={() => setPopup(null)}
            onKeep={() => window.clearTimeout(hoverTimer.current)}
            onLeave={() => hoverDriver(null)}
            onOpen={(t) => {
              setPopup(null);
              openTour(t);
            }}
          />
        )}
        {popup?.kind === 'filter' && (
          <Menu
            anchor={popup.rect}
            onClose={() => setPopup(null)}
            items={[...FILTERS, { key: 'issues' as FilterKey, label: 'Need attention' }].map((f) => ({
              label: `${f.key === 'all' ? 'All drivers' : f.label} (${counts[f.key]})`,
              checked: filter === f.key,
              onClick: () => setFilter(f.key),
            }))}
          />
        )}
        {popup?.kind === 'group' && (
          <Menu
            anchor={popup.rect}
            onClose={() => setPopup(null)}
            placement="bottom-end"
            items={GROUP_BY.map((g) => ({
              label: g.label,
              checked: groupBy === g.key,
              onClick: () => {
                setGroupBy(g.key);
                setCollapsed(new Set());
              },
            }))}
          />
        )}
        {popup?.kind === 'bulk-assign' && selected.length > 0 && (
          <Popover anchor={popup.rect} onClose={() => setPopup(null)} placement="top-start" className="bulkassign">
            <div className="bulkassign__head">Assign {selected.length} tour{selected.length > 1 ? 's' : ''} to</div>
            <SmartSelect
              value={undefined}
              placeholder="Choose driver…"
              icon={UserPlus}
              options={data.drivers.map((d) => {
                const a = driverAvailability(idx, d, idx.tourById.get(selected[0])!);
                return { value: d.id, label: driverName(d), state: a.state, reason: a.state === 'available' ? undefined : a.reason };
              })}
              onChange={(v) => bulk.assign(v)}
            />
            <button className="btn btn--ghost btn--sm" onClick={() => bulk.assign(undefined)}>
              Move to Unassigned
            </button>
          </Popover>
        )}

        {panel && (
          <TourPanel
            panel={panel}
            readOnly={readOnly}
            onClose={closePanel}
            onDirtyChange={onDirtyChange}
            pendingDiscard={!!pending}
            onResolvePending={(discard) => {
              const fn = pending;
              setPending(null);
              if (discard && fn) {
                dirtyRef.current = false;
                fn();
              }
            }}
          />
        )}
      </section>
    </Ctx.Provider>
  );
}

/* ------------------------------------------------------------ Sub-views */

/** Plain-language key so nobody has to guess what a style means. */
function Legend() {
  const items = [
    ['live', 'On the road'],
    ['plan', 'Planned'],
    ['late', 'Delayed'],
    ['draft', 'Draft'],
    ['done', 'Completed'],
    ['unassigned', 'Needs a driver'],
    ['issue', 'Problem'],
    ['absent', 'Absent'],
  ] as const;
  return (
    <div className="legend" aria-label="Legend">
      {items.map(([tone, label]) => (
        <span key={tone} className="legend__item">
          <span className={`legend__swatch legend__swatch--${tone}`} aria-hidden />
          {label}
        </span>
      ))}
      <span className="legend__hint">Drag a tour to move it · Click an empty spot to add one</span>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="skeleton" aria-busy="true" aria-label="Loading planner">
      <div className="skeleton__head">
        <span className="skel" style={{ width: 200 }} />
        {Array.from({ length: 7 }, (_, i) => (
          <span key={i} className="skel" />
        ))}
      </div>
      {Array.from({ length: 12 }, (_, r) => (
        <div key={r} className="skeleton__row">
          <span className="skeleton__driver">
            <span className="skel skel--circle" />
            <span className="skel skel--text" style={{ width: 90 + ((r * 37) % 60) }} />
          </span>
          {Array.from({ length: 7 }, (_, c) => (
            <span key={c} className="skel skel--cell" style={{ opacity: (r + c) % 3 === 0 ? 0.35 : 1 }} />
          ))}
        </div>
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, title, text, action, tone }: { icon: typeof Users; title: string; text: string; action?: React.ReactNode; tone?: 'error' }) {
  return (
    <div className={`empty ${tone === 'error' ? 'empty--error' : ''}`} role={tone === 'error' ? 'alert' : 'status'}>
      <span className="empty__icon">
        <Icon size={26} />
      </span>
      <h2>{title}</h2>
      <p>{text}</p>
      {action}
    </div>
  );
}

function DriverQuickCard({
  driverId,
  rect,
  days,
  onClose,
  onKeep,
  onLeave,
  onOpen,
}: {
  driverId: string;
  rect: DOMRect;
  days: string[];
  onClose: () => void;
  onKeep: () => void;
  onLeave: () => void;
  onOpen: (t: Tour) => void;
}) {
  const data = usePlannerStore((s) => s.data);
  const idx = getIndex(data);
  const d = idx.driverById.get(driverId);
  if (!d) return null;
  const today = todayISO();
  const depot = idx.depotById.get(d.depotId);
  const tractor = d.defaultTractorId ? idx.tractorById.get(d.defaultTractorId) : undefined;
  const trailer = d.defaultTrailerId ? idx.trailerById.get(d.defaultTrailerId) : undefined;
  const week = days.flatMap((date) => toursFor(idx, d.id, date));
  const absence = days.map((date) => absenceOn(idx, d.id, date)).find(Boolean);

  return (
    <Popover anchor={rect} onClose={onClose} placement="right-start" className="qcard" onMouseEnter={onKeep} onMouseLeave={onLeave}>
      <div className="qcard__head">
        <Avatar text={initials(d)} id={d.id} size={40} />
        <div>
          <b>{driverName(d)}</b>
          <span>{depot?.name}</span>
        </div>
      </div>
      <a className="qcard__phone" href={`tel:${d.phone.replace(/\s/g, '')}`}>
        <Phone size={14} /> {d.phone}
      </a>
      <div className="qcard__vehicles">
        <span>
          Tractor <b>{tractor ? `${tractor.plate} · ${tractor.model}` : '—'}</b>
        </span>
        <span>
          Trailer <b>{trailer ? `${trailer.plate} · ${trailer.type}` : '—'}</b>
        </span>
      </div>
      <h4>Documents</h4>
      <DocList driver={d} refDate={today} />
      {absence && (
        <p className="qcard__absence">
          {(() => {
            const A = ABSENCE[absence.reason];
            return (
              <>
                <A.icon size={14} /> {A.label} {fmtMedium(absence.from)} → {fmtMedium(absence.to)}
              </>
            );
          })()}
        </p>
      )}
      <h4>
        This period <span className="qcard__count">{week.length} tours</span>
      </h4>
      {week.length === 0 ? (
        <p className="qcard__muted">No tours planned.</p>
      ) : (
        <ul className="qcard__tours">
          {week.slice(0, 7).map((t) => {
            const S = TOUR_STATUS[t.status];
            return (
              <li key={t.id}>
                <button onClick={() => onOpen(t)}>
                  <span className="qcard__date">{fmtShortDay(t.date)}</span>
                  <Trunc className="qcard__route">{routeLabel(t) || 'Route to fill in'}</Trunc>
                  <span className="qcard__st" style={{ color: S.color }}>
                    <S.icon size={12} strokeWidth={2.4} /> {S.label}
                  </span>
                  <span className="qcard__time">{timeLabel(t)}</span>
                </button>
              </li>
            );
          })}
          {week.length > 7 && <li className="qcard__muted">+{week.length - 7} more</li>}
        </ul>
      )}
    </Popover>
  );
}
