/**
 * Pure selectors over PlannerData. No React here — they can be reused by other modules
 * (e.g. a Drivers page showing the same doc rules, a Dashboard widget, tests).
 */
import { DOC_RULES, DOCS, TOUR_STATUS, type DocKey, type DocState, type FilterKey } from './config';
import { addDays, diffDays, fmtShortDay, rangeDays, toMin } from './date';
import type { Absence, Client, Depot, Driver, Issue, Maintenance, PlannerData, Tour, Tractor, Trailer } from './types';

/* ------------------------------------------------------------------ Docs */

export const docState = (expiry: string, refDate: string): DocState => {
  if (expiry < refDate) return 'expired';
  return diffDays(expiry, refDate) <= DOC_RULES.expiringWithinDays ? 'expiring' : 'ok';
};

const rank: Record<DocState, number> = { ok: 0, expiring: 1, expired: 2 };

export const worstDocState = (driver: Driver, refDate: string): DocState =>
  DOCS.reduce<DocState>((w, d) => {
    const s = docState(driver.docs[d.key], refDate);
    return rank[s] > rank[w] ? s : w;
  }, 'ok');

/** The document that blocks this driver on `date`, if any. */
export const blockingDoc = (driver: Driver, date: string): DocKey | undefined =>
  DOC_RULES.expiredBlocksAssignment ? DOCS.find((d) => driver.docs[d.key] < date)?.key : undefined;

export const docLabel = (key: DocKey) => DOCS.find((d) => d.key === key)!.label;

/* ----------------------------------------------------------------- Tours */

export const isActive = (t: Tour) => TOUR_STATUS[t.status].occupies;

/* ------------------------------------------------------------ Multi-day */

export const lastDay = (t: Pick<Tour, 'date' | 'endDate'>) => (t.endDate && t.endDate > t.date ? t.endDate : t.date);
export const isMultiDay = (t: Pick<Tour, 'date' | 'endDate'>) => lastDay(t) !== t.date;
export const tourDays = (t: Pick<Tour, 'date' | 'endDate'>) => rangeDays(t.date, lastDay(t));
export const coversDate = (t: Pick<Tour, 'date' | 'endDate'>, date: string) => t.date <= date && lastDay(t) >= date;
/** 1-based day number and total, e.g. day 3 of 5. */
export const dayOfTour = (t: Tour, date: string) => ({ n: diffDays(date, t.date) + 1, total: diffDays(lastDay(t), t.date) + 1 });

/**
 * Minutes [from, to) the tour occupies on `date`. A multi-day tour fills the whole day
 * between its first and last day. Single-day tours without times return null (unknown).
 */
export function windowOn(t: Pick<Tour, 'date' | 'endDate' | 'start' | 'end'>, date: string): [number, number] | null {
  if (!coversDate(t, date)) return null;
  if (!isMultiDay(t)) return t.start && t.end ? [toMin(t.start), toMin(t.end)] : null;
  const from = date === t.date && t.start ? toMin(t.start) : 0;
  const to = date === lastDay(t) && t.end ? toMin(t.end) : 24 * 60;
  return [from, to];
}

/** Do two tours occupy the same time on `date` (default: `a`'s first day)? */
export const overlaps = (a: Tour, b: Tour, date = a.date) => {
  const wa = windowOn(a, date);
  const wb = windowOn(b, date);
  return !!(wa && wb) && wa[0] < wb[1] && wb[0] < wa[1];
};

/** Do two tours share at least one day, and clash on it? Returns the first clashing day. */
export const clashDay = (a: Tour, b: Tour) => tourDays(a).find((d) => coversDate(b, d) && overlaps(a, b, d));

export const hasRoute = (t: Tour) => t.stops.filter((s) => s.city.trim()).length >= 2;
export const hasVehicles = (t: Tour) => !!(t.tractorId && t.trailerId);
export const isComplete = (t: Tour) => hasRoute(t) && hasVehicles(t);

export const routeLabel = (t: Tour) => {
  const cities = t.stops.map((s) => s.city.trim()).filter(Boolean);
  if (cities.length === 0) return '';
  if (cities.length === 1) return `${cities[0]} → ?`;
  if (cities.length === 2) return `${cities[0]} → ${cities[1]}`;
  return `${cities[0]} → ${cities.at(-1)}`;
};

export const routeFull = (t: Tour) =>
  t.stops
    .map((s) => s.city.trim())
    .filter(Boolean)
    .join(' → ');

export const timeLabel = (t: Tour) => {
  if (isMultiDay(t)) return `${fmtShortDay(t.date)}${t.start ? ` ${t.start}` : ''} → ${fmtShortDay(lastDay(t))}${t.end ? ` ${t.end}` : ''}`;
  return t.start ? `${t.start}${t.end ? `–${t.end}` : ''}` : 'All day';
};

export const etaLabel = (t: Tour) => {
  if (t.status !== 'delayed' || !t.end || !t.delayMin) return undefined;
  const m = toMin(t.end) + t.delayMin;
  const time = `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  return isMultiDay(t) ? `${fmtShortDay(lastDay(t))} ${time}` : time;
};

/* ----------------------------------------------------------------- Index */

export interface PlannerIndex {
  data: PlannerData;
  driverById: Map<string, Driver>;
  tractorById: Map<string, Tractor>;
  trailerById: Map<string, Trailer>;
  clientById: Map<string, Client>;
  depotById: Map<string, Depot>;
  tourById: Map<string, Tour>;
  /** `${driverId}|${date}` → tours (sorted by start). */
  cells: Map<string, Tour[]>;
  /** date → tours without driver. */
  unassigned: Map<string, Tour[]>;
  absences: Map<string, Absence[]>;
  maintenance: Map<string, Maintenance[]>;
  issues: Map<string, Issue[]>;
}

const cache = new WeakMap<PlannerData, PlannerIndex>();

export const cellKey = (driverId: string, date: string) => `${driverId}|${date}`;

const push = <K, V>(m: Map<K, V[]>, k: K, v: V) => {
  const arr = m.get(k);
  if (arr) arr.push(v);
  else m.set(k, [v]);
};

export function getIndex(data: PlannerData): PlannerIndex {
  const hit = cache.get(data);
  if (hit) return hit;

  const byId = <T extends { id: string }>(arr: T[]) => new Map(arr.map((x) => [x.id, x]));
  const idx: PlannerIndex = {
    data,
    driverById: byId(data.drivers),
    tractorById: byId(data.tractors),
    trailerById: byId(data.trailers),
    clientById: byId(data.clients),
    depotById: byId(data.depots),
    tourById: byId(data.tours),
    cells: new Map(),
    unassigned: new Map(),
    absences: new Map(),
    maintenance: new Map(),
    issues: new Map(),
  };

  for (const a of data.absences) push(idx.absences, a.driverId, a);
  for (const m of data.maintenance) push(idx.maintenance, m.vehicleId, m);

  const byStart = (a: Tour, b: Tour) => (a.start ?? '').localeCompare(b.start ?? '');
  const byDate = new Map<string, Tour[]>();
  for (const t of data.tours) {
    // A multi-day tour is indexed on every day it covers, so every rule sees it.
    // Unassigned tours only show on the day they leave.
    for (const d of tourDays(t)) {
      if (t.driverId) push(idx.cells, cellKey(t.driverId, d), t);
      push(byDate, d, t);
    }
    if (!t.driverId) push(idx.unassigned, t.date, t);
  }
  idx.cells.forEach((arr) => arr.sort(byStart));
  idx.unassigned.forEach((arr) => arr.sort(byStart));

  // Issues
  const add = (t: Tour, issue: Issue) => {
    const list = idx.issues.get(t.id) ?? [];
    if (!list.some((i) => i.kind === issue.kind && i.message === issue.message)) list.push(issue);
    idx.issues.set(t.id, list);
  };

  for (const [date, tours] of byDate) {
    const active = tours.filter((t) => isActive(t) && t.status !== 'completed');
    for (let i = 0; i < active.length; i++) {
      const a = active[i];
      for (let j = i + 1; j < active.length; j++) {
        const b = active[j];
        if (a.driverId && a.driverId === b.driverId && overlaps(a, b, date)) {
          add(a, { kind: 'driver_conflict', severity: 'error', message: `Driver double-booked with ${b.id}` });
          add(b, { kind: 'driver_conflict', severity: 'error', message: `Driver double-booked with ${a.id}` });
        }
        const sameDriver = a.driverId && a.driverId === b.driverId;
        const known = windowOn(a, date) && windowOn(b, date);
        const clash = sameDriver ? overlaps(a, b, date) : !known || overlaps(a, b, date);
        if (!clash) continue;
        for (const [key, kind] of [['tractorId', 'Tractor'], ['trailerId', 'Trailer']] as const) {
          if (a[key] && a[key] === b[key] && !sameDriver) {
            const plate = (key === 'tractorId' ? idx.tractorById : idx.trailerById).get(a[key]!)?.plate;
            add(a, { kind: 'vehicle_conflict', severity: 'error', message: `${kind} ${plate} also on ${b.id}` });
            add(b, { kind: 'vehicle_conflict', severity: 'error', message: `${kind} ${plate} also on ${a.id}` });
          }
        }
      }
    }

    for (const t of tours) {
      if (!isActive(t) || t.status === 'completed') continue;
      if (!hasVehicles(t))
        add(t, { kind: 'missing_vehicle', severity: 'warning', message: !t.tractorId && !t.trailerId ? 'Vehicle to assign' : !t.tractorId ? 'Tractor to assign' : 'Semi-trailer to assign' });
      if (!hasRoute(t)) add(t, { kind: 'missing_route', severity: 'warning', message: 'Route to fill in' });
      if (t.driverId) {
        const abs = absenceOn(idx, t.driverId, date);
        const on = isMultiDay(t) ? ` on ${fmtShortDay(date)}` : '';
        if (abs) add(t, { kind: 'driver_absent', severity: 'error', message: `Driver absent${on} (${abs.reason === 'sick' ? 'sick leave' : abs.reason})` });
        const d = idx.driverById.get(t.driverId);
        const doc = d && blockingDoc(d, date);
        if (doc) add(t, { kind: 'driver_blocked', severity: 'error', message: `Driver blocked${on}: ${docLabel(doc)} expired` });
      }
      for (const vid of [t.tractorId, t.trailerId]) {
        const m = vid && maintenanceOn(idx, vid, date);
        if (m) add(t, { kind: 'vehicle_maintenance', severity: 'error', message: `${vid!.startsWith('TR') ? 'Tractor' : 'Trailer'} in maintenance (${m.note})` });
      }
    }
  }

  cache.set(data, idx);
  return idx;
}

export const absenceOn = (idx: PlannerIndex, driverId: string, date: string) =>
  idx.absences.get(driverId)?.find((a) => a.from <= date && a.to >= date);

export const maintenanceOn = (idx: PlannerIndex, vehicleId: string, date: string) =>
  idx.maintenance.get(vehicleId)?.find((m) => m.from <= date && m.to >= date);

export const toursFor = (idx: PlannerIndex, driverId: string, date: string) => idx.cells.get(cellKey(driverId, date)) ?? EMPTY_TOURS;
export const EMPTY_TOURS: Tour[] = [];

export const tourIssues = (idx: PlannerIndex, id: string) => idx.issues.get(id) ?? EMPTY_ISSUES;
const EMPTY_ISSUES: Issue[] = [];

export const driverName = (d?: Driver) => (d ? `${d.firstName} ${d.lastName}` : 'Unassigned');
export const initials = (d: Driver) => `${d.firstName[0]}${d.lastName.replace(/^(De |D')/, '')[0]}`.toUpperCase();

/* ---------------------------------------------------- Day / driver status */

export type DayState =
  | { kind: 'absent'; absence: Absence }
  | { kind: 'blocked'; doc: DocKey }
  | { kind: 'busy' }
  | { kind: 'free' };

export const dayState = (idx: PlannerIndex, driver: Driver, date: string): DayState => {
  const absence = absenceOn(idx, driver.id, date);
  if (absence) return { kind: 'absent', absence };
  const doc = blockingDoc(driver, date);
  if (doc) return { kind: 'blocked', doc };
  return toursFor(idx, driver.id, date).some(isActive) ? { kind: 'busy' } : { kind: 'free' };
};

export interface DaySummary {
  busy: number;
  free: number;
  absent: number;
  blocked: number;
  unassigned: number;
}

export function daySummary(idx: PlannerIndex, drivers: Driver[], date: string): DaySummary {
  const s: DaySummary = { busy: 0, free: 0, absent: 0, blocked: 0, unassigned: 0 };
  for (const d of drivers) {
    const st = dayState(idx, d, date);
    if (st.kind === 'absent') s.absent++;
    else if (st.kind === 'blocked') s.blocked++;
    else if (st.kind === 'busy') s.busy++;
    else s.free++;
  }
  s.unassigned = (idx.unassigned.get(date) ?? []).filter(isActive).length;
  return s;
}

/* --------------------------------------------------------------- Filters */

export interface DriverPeriodStats {
  busy: boolean;
  available: boolean;
  absent: boolean;
  docIssues: boolean;
  delayed: boolean;
  issues: boolean;
}

export function driverPeriodStats(idx: PlannerIndex, driver: Driver, days: string[], refDate: string): DriverPeriodStats {
  const s: DriverPeriodStats = { busy: false, available: false, absent: false, docIssues: false, delayed: false, issues: false };
  s.docIssues = worstDocState(driver, refDate) !== 'ok' || days.some((d) => !!blockingDoc(driver, d));
  for (const date of days) {
    const st = dayState(idx, driver, date);
    if (st.kind === 'absent') s.absent = true;
    if (st.kind === 'busy') s.busy = true;
    if (st.kind === 'free') s.available = true;
    for (const t of toursFor(idx, driver.id, date)) {
      if (t.status === 'delayed') s.delayed = true;
      if (tourIssues(idx, t.id).length) s.issues = true;
    }
  }
  if (s.docIssues) s.issues = true;
  return s;
}

export const matchesFilter = (s: DriverPeriodStats, f: FilterKey) => (f === 'all' ? true : s[f]);

/* ---------------------------------------------------------- Availability */

export type Availability = { state: 'available' } | { state: 'busy'; reason: string } | { state: 'unavailable'; reason: string };

type Draft = Pick<Tour, 'id' | 'date' | 'endDate' | 'start' | 'end'>;

const absenceWord = (r: string) => (r === 'holiday' ? 'on holiday' : r === 'sick' ? 'sick leave' : 'absent');

/** Can this driver take the draft tour? Checks every day the tour covers. */
export function driverAvailability(idx: PlannerIndex, driver: Driver, draft: Draft): Availability {
  const days = tourDays(draft);
  const multi = days.length > 1;
  for (const d of days) {
    const abs = absenceOn(idx, driver.id, d);
    if (abs) {
      const w = absenceWord(abs.reason);
      return { state: 'unavailable', reason: multi ? `${w[0].toUpperCase()}${w.slice(1)} ${fmtShortDay(d)}` : `${w[0].toUpperCase()}${w.slice(1)}` };
    }
    const doc = blockingDoc(driver, d);
    if (doc) return { state: 'unavailable', reason: `${docLabel(doc)} expired${multi ? ` by ${fmtShortDay(d)}` : ''}` };
  }
  const others = new Map<string, Tour>();
  for (const d of days) for (const t of toursFor(idx, driver.id, d)) if (t.id !== draft.id && isActive(t)) others.set(t.id, t);
  const clash = [...others.values()].find((t) => clashDay(draft as Tour, t));
  if (clash) return { state: 'unavailable', reason: `Already on tour ${clash.id}` };
  if (others.size) return { state: 'busy', reason: `Also on ${[...others.keys()].join(', ')}` };
  return { state: 'available' };
}

export function vehicleAvailability(
  idx: PlannerIndex,
  vehicleId: string,
  key: 'tractorId' | 'trailerId',
  draft: Draft & Pick<Tour, 'driverId'>,
): Availability {
  const days = tourDays(draft);
  for (const d of days) if (maintenanceOn(idx, vehicleId, d)) return { state: 'unavailable', reason: days.length > 1 ? `In maintenance ${fmtShortDay(d)}` : 'In maintenance' };
  const clash = idx.data.tours.find((t) => {
    if (t.id === draft.id || t[key] !== vehicleId || !isActive(t) || t.status === 'completed') return false;
    return days.some((d) => {
      if (!coversDate(t, d)) return false;
      if (draft.driverId && t.driverId === draft.driverId) return overlaps(t, draft as Tour, d);
      return true;
    });
  });
  if (clash) return { state: 'unavailable', reason: `Already on tour ${clash.id}` };
  return { state: 'available' };
}

/** Validation of a drop target during drag & drop. */
export type DropCheck = { ok: true; warning?: string } | { ok: false; reason: string };

export function checkDrop(idx: PlannerIndex, tours: Tour[], driverId: string | undefined, date: string): DropCheck {
  if (tours.some((t) => !TOUR_STATUS[t.status].editable)) return { ok: false, reason: 'Completed tours can’t be moved' };
  if (!driverId || !tours.length) return { ok: true };
  const driver = idx.driverById.get(driverId)!;
  const offset = diffDays(date, tours[0].date);
  const moved = tours.map((t) => ({ ...t, date: addDays(t.date, offset), endDate: t.endDate && addDays(t.endDate, offset) }));
  for (const t of moved) {
    const days = tourDays(t);
    for (const d of days) {
      const abs = absenceOn(idx, driverId, d);
      if (abs) return { ok: false, reason: `Can’t assign · ${absenceWord(abs.reason)}${days.length > 1 ? ` ${fmtShortDay(d)}` : ''}` };
      const doc = blockingDoc(driver, d);
      if (doc) return { ok: false, reason: `Can’t assign · ${docLabel(doc)} expired${days.length > 1 ? ` by ${fmtShortDay(d)}` : ''}` };
    }
  }
  const moving = new Set(tours.map((t) => t.id));
  const existing = new Map<string, Tour>();
  for (const t of moved) for (const d of tourDays(t)) for (const e of toursFor(idx, driverId, d)) if (!moving.has(e.id) && isActive(e)) existing.set(e.id, e);
  const clash = [...existing.values()].find((e) => moved.some((t) => clashDay(t, e)));
  if (clash) return { ok: true, warning: `Overlaps ${clash.id}` };
  if (existing.size) return { ok: true, warning: `+${existing.size} tour${existing.size > 1 ? 's' : ''} those days` };
  return { ok: true };
}

/* ------------------------------------------------------ Driver "right now" */

export type NowTone = 'road' | 'late' | 'free' | 'off' | 'blocked' | 'done';

/** One plain sentence describing what the driver is doing on `date` (live when `date` is today). */
export function driverNow(idx: PlannerIndex, driver: Driver, date: string, today: string, now: number): { tone: NowTone; text: string } {
  const abs = absenceOn(idx, driver.id, date);
  if (abs) {
    const what = abs.reason === 'holiday' ? 'On holiday' : abs.reason === 'sick' ? 'Sick leave' : abs.note ?? 'Absent';
    return { tone: 'off', text: abs.to > date ? `${what} until ${fmtDay(abs.to)}` : `${what} today` };
  }
  const doc = blockingDoc(driver, date);
  if (doc) return { tone: 'blocked', text: `Can’t drive · ${docLabel(doc)} expired` };
  const tours = toursFor(idx, driver.id, date).filter(isActive);
  if (!tours.length) return { tone: 'free', text: date === today ? 'Available all day' : 'Available' };
  const dest = (t: Tour) => t.stops.map((s) => s.city).filter(Boolean).at(-1) ?? '?';
  const trip = tours.find(isMultiDay);
  if (trip) {
    const { n, total } = dayOfTour(trip, date);
    const back = date === lastDay(trip) ? `arrives ${dest(trip)}${trip.end ? ` ${trip.end}` : ''}` : `back ${fmtDay(lastDay(trip))}`;
    if (trip.status === 'delayed' && date === today) return { tone: 'late', text: `Delayed ${trip.delayMin} min · day ${n} of ${total}, ${back}` };
    if (n === 1 && trip.start && (date > today || (date === today && toMin(trip.start) > now)))
      return { tone: 'free', text: `Leaves ${trip.start} · ${total}-day tour to ${dest(trip)}` };
    return { tone: date < today ? 'done' : 'road', text: `Day ${n} of ${total} to ${dest(trip)} · ${back}` };
  }
  if (date !== today) {
    const first = tours.find((t) => t.start);
    const n = tours.length;
    return { tone: date < today ? 'done' : 'road', text: `${n} tour${n > 1 ? 's' : ''}${first ? ` · starts ${first.start}` : ''}` };
  }
  const live = tours.find((t) => t.status === 'delayed') ?? tours.find((t) => t.status === 'in_transit');
  if (live) {
    const eta = etaLabel(live) ?? live.end;
    if (live.status === 'delayed') return { tone: 'late', text: `Delayed ${live.delayMin} min · arrives ${dest(live)} ${eta ?? ''}`.trim() };
    return { tone: 'road', text: `On the road · arrives ${dest(live)}${eta ? ` ${eta}` : ''}` };
  }
  const next = tours.find((t) => t.start && toMin(t.start) > now && t.status !== 'completed');
  if (next) return { tone: 'free', text: `Available · next tour ${next.start}` };
  if (tours.every((t) => t.status === 'completed')) return { tone: 'done', text: 'Done for today' };
  return { tone: 'road', text: `${tours.length} tour${tours.length > 1 ? 's' : ''} today` };
}

const fmtDay = (iso: string) => new Date(`${iso}T00:00`).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' });
