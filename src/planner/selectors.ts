/**
 * Pure selectors over PlannerData. No React here — they can be reused by other modules
 * (e.g. a Drivers page showing the same doc rules, a Dashboard widget, tests).
 */
import { DOC_RULES, DOCS, TOUR_STATUS, type DocKey, type DocState, type FilterKey } from './config';
import { diffDays, toMin } from './date';
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

export const overlaps = (a: Tour, b: Tour) =>
  !!(a.start && a.end && b.start && b.end) && toMin(a.start) < toMin(b.end) && toMin(b.start) < toMin(a.end);

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

export const timeLabel = (t: Tour) => (t.start ? `${t.start}${t.end ? `–${t.end}` : ''}` : 'All day');

export const etaLabel = (t: Tour) => {
  if (t.status !== 'delayed' || !t.end || !t.delayMin) return undefined;
  const m = toMin(t.end) + t.delayMin;
  return `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
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
    if (t.driverId) push(idx.cells, cellKey(t.driverId, t.date), t);
    else push(idx.unassigned, t.date, t);
    push(byDate, t.date, t);
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
        if (a.driverId && a.driverId === b.driverId && overlaps(a, b)) {
          add(a, { kind: 'driver_conflict', severity: 'error', message: `Driver double-booked with ${b.id}` });
          add(b, { kind: 'driver_conflict', severity: 'error', message: `Driver double-booked with ${a.id}` });
        }
        const sameDriver = a.driverId && a.driverId === b.driverId;
        const clash = sameDriver ? overlaps(a, b) : !(a.start && b.start) || overlaps(a, b);
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
        if (abs) add(t, { kind: 'driver_absent', severity: 'error', message: `Driver absent (${abs.reason === 'sick' ? 'sick leave' : abs.reason})` });
        const d = idx.driverById.get(t.driverId);
        const doc = d && blockingDoc(d, date);
        if (doc) add(t, { kind: 'driver_blocked', severity: 'error', message: `Driver blocked: ${docLabel(doc)} expired` });
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

export function driverAvailability(idx: PlannerIndex, driver: Driver, draft: Pick<Tour, 'id' | 'date' | 'start' | 'end'>): Availability {
  const abs = absenceOn(idx, driver.id, draft.date);
  if (abs) return { state: 'unavailable', reason: abs.reason === 'holiday' ? 'On holiday' : abs.reason === 'sick' ? 'Sick leave' : 'Absent' };
  const doc = blockingDoc(driver, draft.date);
  if (doc) return { state: 'unavailable', reason: `${docLabel(doc)} expired` };
  const others = toursFor(idx, driver.id, draft.date).filter((t) => t.id !== draft.id && isActive(t));
  const clash = others.find((t) => overlaps(t, draft as Tour));
  if (clash) return { state: 'unavailable', reason: `Already on tour ${clash.id}` };
  if (others.length) return { state: 'busy', reason: `Also on ${others.map((t) => t.id).join(', ')}` };
  return { state: 'available' };
}

export function vehicleAvailability(
  idx: PlannerIndex,
  vehicleId: string,
  key: 'tractorId' | 'trailerId',
  draft: Pick<Tour, 'id' | 'date' | 'start' | 'end' | 'driverId'>,
): Availability {
  const m = maintenanceOn(idx, vehicleId, draft.date);
  if (m) return { state: 'unavailable', reason: 'In maintenance' };
  const clash = idx.data.tours.find(
    (t) =>
      t.date === draft.date &&
      t.id !== draft.id &&
      t[key] === vehicleId &&
      isActive(t) &&
      t.status !== 'completed' &&
      (!draft.driverId || t.driverId !== draft.driverId || overlaps(t, draft as Tour)),
  );
  if (clash) return { state: 'unavailable', reason: `Already on tour ${clash.id}` };
  return { state: 'available' };
}

/** Validation of a drop target during drag & drop. */
export type DropCheck = { ok: true; warning?: string } | { ok: false; reason: string };

export function checkDrop(idx: PlannerIndex, tours: Tour[], driverId: string | undefined, date: string): DropCheck {
  if (tours.some((t) => !TOUR_STATUS[t.status].editable)) return { ok: false, reason: 'Completed tours can’t be moved' };
  if (!driverId) return { ok: true };
  const driver = idx.driverById.get(driverId)!;
  const abs = absenceOn(idx, driverId, date);
  if (abs) return { ok: false, reason: `Can’t assign · ${abs.reason === 'holiday' ? 'on holiday' : abs.reason === 'sick' ? 'sick leave' : 'absent'}` };
  const doc = blockingDoc(driver, date);
  if (doc) return { ok: false, reason: `Can’t assign · ${docLabel(doc)} expired` };
  const moving = new Set(tours.map((t) => t.id));
  const existing = toursFor(idx, driverId, date).filter((t) => !moving.has(t.id) && isActive(t));
  const clash = existing.find((e) => tours.some((t) => overlaps(e, { ...t, date })));
  if (clash) return { ok: true, warning: `Overlaps ${clash.id}` };
  if (existing.length) return { ok: true, warning: `+${existing.length} tour${existing.length > 1 ? 's' : ''} that day` };
  return { ok: true };
}
