/**
 * Planner store — domain data + mutations, independent from any UI.
 * Other modules (Trips, Drivers, Means) can read `usePlannerStore` or replace `load()`
 * with a real API call without touching components.
 */
import { create } from 'zustand';
import { addDays } from './date';
import { generateMock, type Scenario } from './mock';
import type { PlannerData, Tour } from './types';

export interface Toast {
  id: number;
  message: string;
  tone?: 'default' | 'error';
  undoable?: boolean;
}

type LoadStatus = 'loading' | 'ready' | 'error';

interface PlannerStore {
  status: LoadStatus;
  scenario: Scenario;
  data: PlannerData;
  /** Undo stack of previous `tours` arrays. */
  past: Tour[][];
  toast: Toast | null;

  load: (scenario?: Scenario) => void;
  retry: () => void;

  saveTour: (tour: Tour, message?: string) => void;
  createTours: (tours: Omit<Tour, 'id'>[], message: string) => string[];
  updateTours: (ids: string[], patch: (t: Tour) => Tour, message: string) => void;
  deleteTours: (ids: string[], message?: string) => void;
  copyTours: (ids: string[], dayOffsets: number[], message: string) => void;
  undo: () => void;

  showToast: (message: string, opts?: Omit<Toast, 'id' | 'message'>) => void;
  dismissToast: () => void;
}

const EMPTY: PlannerData = { depots: [], drivers: [], tractors: [], trailers: [], clients: [], absences: [], maintenance: [], tours: [] };

let toastSeq = 0;
let loadToken = 0;

const nextIds = (tours: Tour[], n: number) => {
  let max = tours.reduce((m, t) => Math.max(m, Number(t.id.slice(4)) || 0), 0);
  return Array.from({ length: n }, () => `TRP-${String(++max).padStart(4, '0')}`);
};

export const usePlannerStore = create<PlannerStore>((set, get) => {
  /** Replace tours, push the previous array on the undo stack, show a toast. */
  const commit = (tours: Tour[], message: string) => {
    const prev = get().data.tours;
    set((s) => ({
      data: { ...s.data, tours },
      past: [...s.past.slice(-29), prev],
      toast: { id: ++toastSeq, message, undoable: true },
    }));
  };

  return {
    status: 'loading',
    scenario: 'default',
    data: EMPTY,
    past: [],
    toast: null,

    load: (scenario = get().scenario) => {
      const token = ++loadToken;
      set({ status: 'loading', scenario, past: [], toast: null });
      if (scenario === 'loading') return; // stays in skeleton for review
      setTimeout(() => {
        if (token !== loadToken) return;
        if (scenario === 'error') return set({ status: 'error' });
        const data =
          scenario === 'empty'
            ? { ...EMPTY, depots: generateMock().depots }
            : generateMock({ drivers: 100, scenario });
        set({ status: 'ready', data });
      }, 650);
    },

    retry: () => {
      // Retrying the error scenario succeeds, so the recovery path can be reviewed.
      get().load(get().scenario === 'error' ? 'default' : get().scenario);
    },

    saveTour: (tour, message = 'Tour saved') => {
      const tours = get().data.tours;
      const exists = tours.some((t) => t.id === tour.id);
      commit(exists ? tours.map((t) => (t.id === tour.id ? tour : t)) : [...tours, tour], message);
    },

    createTours: (newTours, message) => {
      const tours = get().data.tours;
      const ids = nextIds(tours, newTours.length);
      commit([...tours, ...newTours.map((t, i) => ({ ...t, id: ids[i] }))], message);
      return ids;
    },

    updateTours: (ids, patch, message) => {
      const set_ = new Set(ids);
      commit(get().data.tours.map((t) => (set_.has(t.id) ? patch(t) : t)), message);
    },

    deleteTours: (ids, message) => {
      const set_ = new Set(ids);
      commit(
        get().data.tours.filter((t) => !set_.has(t.id)),
        message ?? (ids.length === 1 ? 'Tour deleted' : `${ids.length} tours deleted`),
      );
    },

    copyTours: (ids, dayOffsets, message) => {
      const tours = get().data.tours;
      const src = tours.filter((t) => ids.includes(t.id));
      const copies: Tour[] = [];
      for (const off of dayOffsets)
        for (const t of src)
          copies.push({
            ...t,
            date: addDays(t.date, off),
            status: t.status === 'draft' ? 'draft' : 'assigned',
            delayMin: undefined,
            stops: t.stops.map((s) => ({ ...s, id: `${s.id}-c${off}` })),
          });
      const newIds = nextIds(tours, copies.length);
      commit([...tours, ...copies.map((c, i) => ({ ...c, id: newIds[i] }))], message);
    },

    undo: () => {
      const { past } = get();
      if (!past.length) return;
      set((s) => ({
        data: { ...s.data, tours: past[past.length - 1] },
        past: past.slice(0, -1),
        toast: { id: ++toastSeq, message: 'Change undone' },
      }));
    },

    showToast: (message, opts) => set({ toast: { id: ++toastSeq, message, ...opts } }),
    dismissToast: () => set({ toast: null }),
  };
});
