/**
 * Deterministic mock data, generated relative to today so the demo always looks "live".
 * 100 drivers · 3 depots · 80 tractors · 90 trailers · two weeks of tours (this week + next).
 */
import type { AbsenceReason, DocKey, TourStatus } from './config';
import { addDays, fromISO, fromMin, isWeekend, nowMin, startOfWeek, toMin, todayISO } from './date';
import type {
  Absence,
  Client,
  Depot,
  Driver,
  Maintenance,
  PlannerData,
  Stop,
  Tour,
  Tractor,
  Trailer,
  TrailerType,
} from './types';

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = [
  'Marco', 'Luca', 'Giuseppe', 'Francesco', 'Alessandro', 'Andrea', 'Matteo', 'Lorenzo', 'Davide', 'Simone',
  'Federico', 'Riccardo', 'Stefano', 'Paolo', 'Antonio', 'Giovanni', 'Roberto', 'Fabio', 'Massimo', 'Daniele',
  'Emanuele', 'Nicola', 'Salvatore', 'Vincenzo', 'Gabriele', 'Claudio', 'Pietro', 'Filippo', 'Enrico', 'Michele',
  'Giulia', 'Chiara', 'Francesca', 'Sara', 'Elena', 'Valentina', 'Martina', 'Alessia', 'Silvia', 'Laura',
];
const LAST = [
  'Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco',
  'Bruno', 'Gallo', 'Conti', 'De Luca', 'Mancini', 'Costa', 'Giordano', 'Rizzo', 'Lombardi', 'Moretti',
  'Barbieri', 'Fontana', 'Santoro', 'Mariani', 'Rinaldi', 'Caruso', 'Ferrara', 'Galli', 'Martini', 'Leone',
  'Longo', 'Gentile', 'Martinelli', 'Vitale', 'Lombardo', 'Serra', 'Coppola', 'De Santis', "D'Angelo", 'Marchetti',
  'Parisi', 'Villa', 'Conte', 'Ferraro', 'Ferri', 'Fabbri', 'Bianco', 'Marini', 'Grasso', 'Valentini',
];

export const CITIES = [
  'Milano', 'Roma', 'Torino', 'Napoli', 'Bologna', 'Firenze', 'Verona', 'Genova', 'Venezia', 'Padova',
  'Brescia', 'Bergamo', 'Parma', 'Modena', 'Bari', 'Ancona', 'Pescara', 'Trieste', 'Trento', 'Bolzano',
  'Piacenza', 'Livorno', 'La Spezia', 'Novara', 'Vicenza', 'Treviso', 'Udine', 'Rimini', 'Perugia', 'Salerno',
  'Reggio Emilia', 'Mantova', 'Como', 'Cremona', 'Ravenna', 'Ferrara', 'Alessandria', 'Pisa',
  'München', 'Lyon', 'Wien', 'Zürich', 'Ljubljana', 'Innsbruck',
];

const CLIENT_NAMES = [
  'Latteria Padana S.c.a.', 'Metalli Brianza S.p.A.', 'Conserve del Sole Srl', 'Vini Colli Euganei Srl',
  'Mobili Friulani Srl', 'Plastiche Nord Srl', 'Carta & Imballi Srl', 'Agrumi di Sicilia Srl',
  'Farmalog Italia S.p.A.', 'Ceramiche Emiliane Srl', 'Frigo Express Srl', 'Tessiture Venete Srl',
  'Pastificio Val Padana', 'Edil Materiali Lombardi', 'Ricambi Auto Torino', 'Ortofrutta Adriatica',
  'Elettro Componenti Srl', 'Birrificio Alpino', 'Acque Minerali Dolomiti', 'Logistica Tirrenica',
];

const TRACTOR_MODELS = ['Volvo FH16', 'Volvo FH 500', 'Scania R450', 'Scania S500', 'MAN TGX 18.510', 'Iveco S-Way 490', 'DAF XF 480', 'Mercedes Actros 1845'];
const TRAILER_TYPES: TrailerType[] = ['Tautliner', 'Tautliner', 'Tautliner', 'Reefer', 'Reefer', 'Box', 'Flatbed', 'Tanker'];

const LETTERS = 'ABCDEFGHJKLMNPRSTVWXYZ';

export type Scenario =
  | 'default'
  | 'loading'
  | 'error'
  | 'empty'
  | 'no-tours'
  | 'no-results'
  | 'conflict';

export const SCENARIOS: { key: Scenario; label: string; hint: string }[] = [
  { key: 'default', label: 'Default', hint: '100 drivers, realistic mix of all states' },
  { key: 'loading', label: 'Loading', hint: 'Skeleton rows (never resolves)' },
  { key: 'error', label: 'Error', hint: 'Loading fails, Retry succeeds' },
  { key: 'empty', label: 'Empty company', hint: 'No drivers yet' },
  { key: 'no-tours', label: 'No tours', hint: 'Drivers exist, no tours planned' },
  { key: 'no-results', label: 'No results', hint: 'Search that matches nothing' },
  { key: 'conflict', label: 'Conflicts', hint: 'Extra double-bookings today' },
];

export function generateMock(opts: { drivers?: number; scenario?: Scenario } = {}): PlannerData {
  const driverCount = opts.drivers ?? 100;
  const r = rng(20260927 + driverCount);
  const pick = <T,>(arr: T[]) => arr[Math.floor(r() * arr.length)];
  const chance = (p: number) => r() < p;
  const int = (min: number, max: number) => min + Math.floor(r() * (max - min + 1));
  const letters = (n: number, prefix = '') => {
    let s = prefix;
    while (s.length < n) s += LETTERS[Math.floor(r() * LETTERS.length)];
    return s;
  };
  const plate = () => `${letters(2)} ${String(int(100, 999))} ${letters(2)}`;
  const trailerPlate = () => `${letters(2, 'X')} ${String(int(100, 999))} ${letters(2)}`;

  const today = todayISO();
  const weekStart = startOfWeek(today);
  const periodStart = weekStart;
  const periodEnd = addDays(weekStart, 13);

  const depots: Depot[] = [
    { id: 'DEP-MI', name: 'Milano Lainate', city: 'Milano' },
    { id: 'DEP-VR', name: 'Verona Quadrante Europa', city: 'Verona' },
    { id: 'DEP-BO', name: 'Bologna Interporto', city: 'Bologna' },
  ];
  const depotFor = (i: number, n: number) => (i < n * 0.45 ? depots[0] : i < n * 0.75 ? depots[1] : depots[2]);

  const clients: Client[] = CLIENT_NAMES.map((name, i) => ({ id: `CLI-${String(i + 1).padStart(3, '0')}`, name }));

  const tractorCount = Math.round(driverCount * 0.8);
  const trailerCount = Math.round(driverCount * 0.9);
  const tractors: Tractor[] = Array.from({ length: tractorCount }, (_, i) => ({
    id: `TR-${String(i + 1).padStart(3, '0')}`,
    plate: plate(),
    model: pick(TRACTOR_MODELS),
    depotId: depotFor(i, tractorCount).id,
  }));
  const trailers: Trailer[] = Array.from({ length: trailerCount }, (_, i) => ({
    id: `SR-${String(i + 1).padStart(3, '0')}`,
    plate: trailerPlate(),
    type: pick(TRAILER_TYPES),
    depotId: depotFor(i, trailerCount).id,
  }));

  // Unique names.
  const used = new Set<string>();
  const drivers: Driver[] = [];
  for (let i = 0; i < driverCount; i++) {
    let first = '';
    let last = '';
    do {
      first = pick(FIRST);
      last = pick(LAST);
    } while (used.has(first + last) && used.size < FIRST.length * LAST.length);
    used.add(first + last);
    const docDate = () => addDays(today, int(45, 900));
    drivers.push({
      id: `DRV-${String(i + 1).padStart(3, '0')}`,
      firstName: first,
      lastName: last,
      phone: `+39 3${int(20, 49)} ${int(100, 999)} ${int(1000, 9999)}`,
      depotId: depotFor(i, driverCount).id,
      defaultTractorId: i < tractorCount ? tractors[i].id : undefined,
      defaultTrailerId: i < trailerCount ? trailers[i].id : undefined,
      docs: { license: docDate(), cqc: docDate(), tacho: docDate() },
    });
  }
  drivers.sort((a, b) => (a.lastName + a.firstName).localeCompare(b.lastName + b.firstName));

  // Document issues: some expiring within 30 days, three expired (blocked).
  const docKeys: DocKey[] = ['license', 'cqc', 'tacho'];
  for (let i = 0; i < Math.round(driverCount * 0.12); i++) {
    const d = drivers[(i * 7 + 3) % driverCount];
    d.docs[pick(docKeys)] = addDays(today, int(4, 29));
  }
  if (driverCount >= 10) {
    drivers[4].docs.cqc = addDays(today, -9); // CQC expired → blocked all period
    drivers[17 % driverCount].docs.license = addDays(today, -2); // license expired
    drivers[31 % driverCount].docs.tacho = addDays(today, 2); // tacho expires mid next week → blocked from then on
  }

  // Absences
  const absences: Absence[] = [];
  const absentCount = Math.round(driverCount * 0.1);
  for (let i = 0; i < absentCount; i++) {
    const d = drivers[(i * 11 + 6) % driverCount];
    if (absences.some((a) => a.driverId === d.id)) continue;
    const reason: AbsenceReason = i % 4 === 0 ? 'sick' : i % 5 === 1 ? 'other' : 'holiday';
    const from = addDays(periodStart, i < absentCount * 0.6 ? int(0, 6) : int(-3, 11));
    const len = reason === 'holiday' ? int(3, 9) : reason === 'sick' ? int(1, 4) : 1;
    absences.push({
      id: `ABS-${i + 1}`,
      driverId: d.id,
      from,
      to: addDays(from, len - 1),
      reason,
      note: reason === 'other' ? pick(['Medical visit', 'Training course', 'Family reasons']) : undefined,
    });
  }
  // Guarantee some absences cover today.
  for (let i = 0; i < Math.min(5, absences.length); i++) {
    const a = absences[i];
    if (!(a.from <= today && a.to >= today)) {
      a.from = addDays(today, -int(0, 2));
      a.to = addDays(today, int(0, 4));
    }
  }

  // Maintenance windows
  const maintenance: Maintenance[] = [];
  for (let i = 0; i < 4; i++) {
    const t = tractors[(i * 13 + 5) % tractorCount];
    const from = addDays(today, int(-2, 6));
    maintenance.push({ id: `MNT-T${i}`, vehicleId: t.id, from, to: addDays(from, int(1, 4)), note: pick(['Scheduled service', 'Brake repair', 'Tyres replacement', 'Annual inspection']) });
  }
  for (let i = 0; i < 4; i++) {
    const t = trailers[(i * 17 + 8) % trailerCount];
    const from = addDays(today, int(-1, 7));
    maintenance.push({ id: `MNT-S${i}`, vehicleId: t.id, from, to: addDays(from, int(1, 3)), note: pick(['Reefer unit service', 'Curtain repair', 'Axle inspection']) });
  }

  const isAbsent = (driverId: string, date: string) => absences.some((a) => a.driverId === driverId && a.from <= date && a.to >= date);
  const isBlocked = (d: Driver, date: string) => docKeys.some((k) => d.docs[k] < date);
  const inMaint = (vid: string, date: string) => maintenance.some((m) => m.vehicleId === vid && m.from <= date && m.to >= date);

  let seq = 280;
  const nextId = () => `TRP-${String(++seq).padStart(4, '0')}`;
  const makeStops = (originCity: string): Stop[] => {
    const stops: Stop[] = [{ id: `s${seq}-0`, city: originCity }];
    const mids = chance(0.22) ? int(1, 2) : 0;
    for (let i = 0; i < mids; i++) stops.push({ id: `s${seq}-m${i}`, city: pick(CITIES) });
    let dest = pick(CITIES);
    while (dest === originCity) dest = pick(CITIES);
    stops.push({ id: `s${seq}-d`, city: dest });
    return stops;
  };

  const now = nowMin();
  const statusFor = (date: string, start?: string, end?: string): { status: TourStatus; delayMin?: number } => {
    if (date < today) return { status: chance(0.03) ? 'cancelled' : 'completed' };
    if (date > today) return { status: chance(0.025) ? 'cancelled' : 'assigned' };
    if (!start || !end) return { status: chance(0.7) ? 'in_transit' : 'assigned' };
    const s = toMin(start);
    const e = toMin(end);
    if (e < now) return { status: 'completed' };
    if (s <= now) return chance(0.18) ? { status: 'delayed', delayMin: int(2, 9) * 10 } : { status: 'in_transit' };
    return { status: 'assigned' };
  };

  const tours: Tour[] = [];
  const noTours = opts.scenario === 'no-tours';
  /** Driver → date ranges of multi-day tours they're on. */
  const trips = new Map<string, [string, string][]>();
  const INTL = ['München', 'Wien', 'Lyon', 'Zürich', 'Ljubljana', 'Innsbruck', 'Paris', 'Barcelona', 'Rotterdam', 'Hamburg', 'Praha', 'Budapest'];
  const tripStatus = (from: string, to: string): { status: TourStatus; delayMin?: number } => {
    if (to < today) return { status: 'completed' };
    if (from > today) return { status: 'assigned' };
    return chance(0.2) ? { status: 'delayed', delayMin: int(3, 9) * 10 } : { status: 'in_transit' };
  };
  const canTrip = (d: Driver, from: string, len: number) => {
    for (let i = 0; i < len; i++) {
      const day = addDays(from, i);
      if (isAbsent(d.id, day) || isBlocked(d, day) || day > periodEnd) return false;
      if ((trips.get(d.id) ?? []).some(([f, t]) => f <= day && t >= day)) return false;
      if (tours.some((x) => x.driverId === d.id && x.date === day)) return false;
    }
    return true;
  };
  const makeTrip = (d: Driver, from: string, len: number, forced?: { start: string; end: string; dest: string }) => {
    const depot = depots.find((x) => x.id === d.depotId)!;
    const to = addDays(from, len - 1);
    const dest = forced?.dest ?? pick(INTL);
    const mid = pick(CITIES.filter((c) => c !== depot.city));
    const st = tripStatus(from, to);
    const id = nextId();
    tours.push({
      id,
      date: from,
      endDate: to,
      driverId: d.id,
      tractorId: d.defaultTractorId,
      trailerId: d.defaultTrailerId,
      start: forced?.start ?? fromMin(int(20, 32) * 15),
      end: forced?.end ?? fromMin(int(44, 68) * 15),
      stops: [
        { id: `${id}-o`, city: depot.city },
        { id: `${id}-m`, city: mid },
        { id: `${id}-d`, city: dest },
      ],
      clientId: pick(clients).id,
      status: st.status,
      delayMin: st.delayMin,
      notes: 'International · CMR on board',
    });
    trips.set(d.id, [...(trips.get(d.id) ?? []), [from, to]]);
  };

  // Two showcase trips so the multi-day case is always visible: one running through today, one leaving tomorrow.
  if (!noTours && driverCount >= 20) {
    const pickFree = (from: string, len: number, skip: number) => drivers.filter((d) => d.defaultTractorId && canTrip(d, from, len))[skip];
    const a = pickFree(addDays(today, -2), 5, 3);
    if (a) makeTrip(a, addDays(today, -2), 5, { start: '06:00', end: '14:00', dest: 'Wien' });
    const b = pickFree(addDays(today, 1), 5, 8);
    if (b && b !== a) makeTrip(b, addDays(today, 1), 5, { start: '05:30', end: '16:00', dest: 'Lyon' });
  }

  for (let date = periodStart; date <= periodEnd && !noTours; date = addDays(date, 1)) {
    const dow = fromISO(date).getDay();
    const factor = isWeekend(date) ? (dow === 6 ? 0.7 : 0.55) : 1;
    const usedTractors = new Set<string>();
    const usedTrailers = new Set<string>();
    const freeTractors = () => tractors.filter((t) => !usedTractors.has(t.id) && !inMaint(t.id, date));
    const freeTrailers = () => trailers.filter((t) => !usedTrailers.has(t.id) && !inMaint(t.id, date));

    // Drivers with default vehicles first, so spare drivers pick up the leftovers.
    // Vehicles already out on a multi-day trip are not available today.
    for (const t of tours) if (t.endDate && t.date <= date && t.endDate >= date) {
      if (t.tractorId) usedTractors.add(t.tractorId);
      if (t.trailerId) usedTrailers.add(t.trailerId);
    }
    const onTrip = (d: Driver) => (trips.get(d.id) ?? []).some(([f, t]) => f <= date && t >= date);
    const working = drivers.filter((d) => !onTrip(d) && !isAbsent(d.id, date) && !isBlocked(d, date) && chance(0.74 * factor));
    working.sort((a, b) => (a.defaultTractorId ? 0 : 1) - (b.defaultTractorId ? 0 : 1));

    for (const d of working) {
      // About 7% of weekday departures are international trips of 2–5 days.
      if (!isWeekend(date) && d.defaultTractorId && !usedTractors.has(d.defaultTractorId) && chance(0.07)) {
        const len = int(2, 5);
        if (canTrip(d, date, len)) {
          makeTrip(d, date, len);
          usedTractors.add(d.defaultTractorId);
          if (d.defaultTrailerId) usedTrailers.add(d.defaultTrailerId);
          continue;
        }
      }
      let tractorId = d.defaultTractorId && !usedTractors.has(d.defaultTractorId) && !inMaint(d.defaultTractorId, date) ? d.defaultTractorId : undefined;
      if (!tractorId) tractorId = freeTractors().find((t) => t.depotId === d.depotId)?.id;
      let trailerId = d.defaultTrailerId && !usedTrailers.has(d.defaultTrailerId) && !inMaint(d.defaultTrailerId, date) ? d.defaultTrailerId : undefined;
      if (!trailerId) trailerId = freeTrailers().find((t) => t.depotId === d.depotId)?.id;
      if (date > today && chance(0.04)) trailerId = undefined; // planned without trailer yet
      if (tractorId) usedTractors.add(tractorId);
      if (trailerId) usedTrailers.add(trailerId);

      const depot = depots.find((x) => x.id === d.depotId)!;
      const timed = chance(0.72);
      const count = chance(0.14) ? 2 : 1;
      let cursor = int(20, 40) * 15; // 05:00 – 10:00
      for (let k = 0; k < count; k++) {
        const dur = count === 2 ? int(12, 20) * 15 : int(16, 40) * 15;
        const start = timed ? fromMin(cursor) : undefined;
        const end = timed ? fromMin(Math.min(cursor + dur, 22 * 60)) : undefined;
        cursor += dur + int(4, 10) * 15;
        const st = statusFor(date, start, end);
        const id = nextId();
        tours.push({
          id,
          date,
          driverId: d.id,
          tractorId,
          trailerId,
          start,
          end,
          stops: makeStops(k === 0 ? (chance(0.8) ? depot.city : pick(CITIES)) : tours[tours.length - 1].stops.at(-1)!.city),
          clientId: pick(clients).id,
          status: !tractorId || !trailerId ? (st.status === 'cancelled' ? 'cancelled' : date >= today ? 'draft' : st.status) : st.status,
          delayMin: st.delayMin,
          notes: chance(0.12) ? pick(['Tail-lift required', 'Call client 30 min before arrival', 'ADR documents on board', 'Keep reefer at 4°C', 'Pallet exchange 33 EPAL']) : undefined,
        });
      }
    }

    // Unassigned tours for today and the future.
    if (date >= today) {
      const n = Math.round(int(4, 11) * (isWeekend(date) ? 0.5 : 1) * (driverCount / 100));
      for (let i = 0; i < n; i++) {
        const origin = chance(0.7) ? pick(depots).city : pick(CITIES);
        const hasRoute = chance(0.85);
        const withVehicle = chance(0.35);
        const timed = chance(0.6);
        const s = int(20, 44) * 15;
        const id = nextId();
        const tractorId = withVehicle ? freeTractors()[0]?.id : undefined;
        const trailerId = withVehicle ? freeTrailers()[0]?.id : undefined;
        if (tractorId) usedTractors.add(tractorId);
        if (trailerId) usedTrailers.add(trailerId);
        tours.push({
          id,
          date,
          stops: hasRoute ? makeStops(origin) : [{ id: `s${seq}-0`, city: origin }, { id: `s${seq}-d`, city: '' }],
          tractorId,
          trailerId,
          start: timed ? fromMin(s) : undefined,
          end: timed ? fromMin(s + int(16, 36) * 15) : undefined,
          clientId: pick(clients).id,
          status: 'draft',
        });
      }
    }
  }

  if (!noTours && driverCount >= 20) injectEdgeCases();

  function injectEdgeCases() {
    const tomorrow = addDays(today, 1);
    const byDriver = (id: string, date: string) => tours.filter((t) => t.driverId === id && t.date === date);
    const worker = (date: string, skip = 0) => {
      const list = drivers.filter((d) => byDriver(d.id, date).some((t) => t.start) && !isAbsent(d.id, date));
      return list[Math.min(skip, list.length - 1)];
    };

    // 1. Driver double-booked today (overlapping times).
    const a = worker(today, 2);
    if (a) {
      const base = byDriver(a.id, today).find((t) => t.start)!;
      const s = toMin(base.start!) + 90;
      tours.push({
        id: nextId(), date: today, driverId: a.id, tractorId: base.tractorId, trailerId: base.trailerId,
        start: fromMin(s), end: fromMin(s + 240), stops: makeStops('Milano'), clientId: clients[3].id,
        status: s > now ? 'assigned' : 'in_transit',
      });
    }
    // 2. Tractor double-booked tomorrow across two drivers.
    const b1 = worker(tomorrow, 5);
    const b2 = worker(tomorrow, 9);
    if (b1 && b2) {
      const t1 = byDriver(b1.id, tomorrow)[0];
      const t2 = byDriver(b2.id, tomorrow)[0];
      t2.tractorId = t1.tractorId;
      t2.start = t1.start;
      t2.end = t1.end;
    }
    // 3. A tour assigned to a driver who is now on sick leave (day after tomorrow).
    const sick = absences.find((x) => x.reason === 'sick');
    if (sick) {
      const d = drivers.find((x) => x.id === sick.driverId)!;
      const date = sick.from >= today ? sick.from : today;
      tours.push({
        id: nextId(), date, driverId: d.id, tractorId: d.defaultTractorId, trailerId: d.defaultTrailerId,
        start: '07:00', end: '15:30', stops: makeStops('Verona'), clientId: clients[7].id, status: 'assigned',
      });
    }
    // 4. Guarantee a few delayed tours today and a draft missing route.
    const onRoad = tours.filter((t) => t.date === today && t.status === 'in_transit' && t.driverId);
    onRoad.slice(0, 3).forEach((t, i) => {
      t.status = 'delayed';
      t.delayMin = [35, 70, 20][i];
    });
    const future = tours.find((t) => t.date === tomorrow && t.driverId && t.status === 'assigned');
    if (future) {
      future.stops = [{ id: 'x1', city: future.stops[0].city }, { id: 'x2', city: '' }];
      future.status = 'draft';
    }
  }

  if (opts.scenario === 'conflict' && driverCount >= 20) {
    // Three more driver double-bookings today.
    const todays = tours.filter((t) => t.date === today && t.driverId && t.start && t.status !== 'cancelled');
    todays.slice(10, 13).forEach((base) => {
      const s = toMin(base.start!) + 60;
      tours.push({
        id: nextId(), date: today, driverId: base.driverId, tractorId: base.tractorId, trailerId: base.trailerId,
        start: fromMin(s), end: fromMin(s + 180), stops: makeStops('Bologna'), clientId: clients[5].id,
        status: s > now ? 'assigned' : 'in_transit',
      });
    });
  }

  tours.sort((x, y) => (x.date + (x.start ?? '99')).localeCompare(y.date + (y.start ?? '99')));
  return { depots, drivers, tractors, trailers, clients, absences, maintenance, tours };
}
