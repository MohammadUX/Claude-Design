/**
 * Planner operations that combine store mutations with domain rules
 * (status transitions, default vehicles on assignment, toast wording).
 */
import { create } from 'zustand';
import { addDays, diffDays, fmtMedium, fromMin, toMin } from './date';
import { driverName, getIndex, isComplete, maintenanceOn, vehicleAvailability, type DropCheck } from './selectors';
import { usePlannerStore } from './store';
import type { Tour } from './types';

/* ----------------------------------------------------------- Drag state */

interface DndState {
  ids: string[] | null;
  overKey: string | null;
  check: DropCheck | null;
  start: (ids: string[]) => void;
  over: (key: string, check: DropCheck) => void;
  leave: (key: string) => void;
  end: () => void;
}

// `dragleave` fires when crossing child elements (and relatedTarget is unreliable),
// so a leave only clears the highlight if no `dragover` on the same cell follows shortly.
let lastOver = 0;
export const useDnd = create<DndState>((set, get) => ({
  ids: null,
  overKey: null,
  check: null,
  start: (ids) => set({ ids, overKey: null, check: null }),
  over: (key, check) => {
    lastOver = performance.now();
    if (get().overKey !== key) set({ overKey: key, check });
  },
  leave: (key) => {
    const at = performance.now();
    window.setTimeout(() => {
      if (get().overKey === key && lastOver < at) set({ overKey: null, check: null });
    }, 90);
  },
  end: () => set({ ids: null, overKey: null, check: null }),
}));

/* --------------------------------------------------------------- Status */

/** Keep status coherent with the data after an edit. */
export function normalizeStatus(t: Tour): Tour {
  if (t.status === 'draft' || t.status === 'assigned') {
    return { ...t, status: t.driverId && isComplete(t) ? 'assigned' : 'draft', delayMin: undefined };
  }
  return t;
}

/** Fill missing tractor / trailer with the driver's defaults when they are free that day. */
function withDefaultVehicles(t: Tour): { tour: Tour; added: boolean } {
  if (!t.driverId || (t.tractorId && t.trailerId)) return { tour: t, added: false };
  const idx = getIndex(usePlannerStore.getState().data);
  const d = idx.driverById.get(t.driverId);
  if (!d) return { tour: t, added: false };
  let added = false;
  const next = { ...t };
  const tryVehicle = (key: 'tractorId' | 'trailerId', vid?: string) => {
    if (next[key] || !vid || maintenanceOn(idx, vid, t.date)) return;
    if (vehicleAvailability(idx, vid, key, next).state !== 'available') return;
    next[key] = vid;
    added = true;
  };
  tryVehicle('tractorId', d.defaultTractorId);
  tryVehicle('trailerId', d.defaultTrailerId);
  return { tour: next, added };
}

/* ---------------------------------------------------------------- Moves */

export interface MoveTarget {
  /** `null` = move to Unassigned. `undefined` = keep driver. */
  driverId?: string | null;
  date: string;
  /** Day view only: new start (minutes). `null` = clear times (All day lane). */
  startMin?: number | null;
}

export function moveTours(ids: string[], target: MoveTarget, primaryId = ids[0]) {
  const store = usePlannerStore.getState();
  const idx = getIndex(store.data);
  const primary = idx.tourById.get(primaryId);
  if (!primary) return;
  const offset = diffDays(target.date, primary.date);
  let addedVehicles = false;

  store.updateTours(
    ids,
    (t) => {
      let next: Tour = { ...t, date: addDays(t.date, offset) };
      if (target.driverId !== undefined) next.driverId = target.driverId ?? undefined;
      if (target.startMin === null) {
        next.start = undefined;
        next.end = undefined;
      } else if (target.startMin !== undefined && t.id === primaryId) {
        const dur = t.start && t.end ? toMin(t.end) - toMin(t.start) : 8 * 60;
        next.start = fromMin(target.startMin);
        next.end = fromMin(Math.min(target.startMin + dur, 24 * 60 - 1));
      }
      if (next.status === 'delayed' || next.status === 'in_transit') {
        // A tour moved to another day is re-planned.
        if (next.date !== t.date) next.status = 'assigned';
      }
      const r = withDefaultVehicles(next);
      if (r.added) addedVehicles = true;
      return normalizeStatus(r.tour);
    },
    moveMessage(ids.length, target, idx.driverById.get(target.driverId ?? '')),
  );

  if (addedVehicles) {
    const toast = usePlannerStore.getState().toast;
    if (toast) usePlannerStore.setState({ toast: { ...toast, message: `${toast.message} · default vehicles added` } });
  }
}

function moveMessage(n: number, target: MoveTarget, driver?: Parameters<typeof driverName>[0]) {
  const what = n === 1 ? 'Tour' : `${n} tours`;
  if (target.driverId === null) return `${what} moved to Unassigned`;
  if (target.driverId) return `${what} assigned to ${driverName(driver)} · ${fmtMedium(target.date)}`;
  return `${what} moved to ${fmtMedium(target.date)}`;
}
