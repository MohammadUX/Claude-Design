import { createContext, useContext, type MouseEvent } from 'react';
import type { Density } from '../config';
import type { DropCheck, PlannerIndex } from '../selectors';
import type { Driver, Tour } from '../types';

/** Everything the grid cells need from their <Planner /> instance (one per instance, so widgets are isolated). */
export interface PlannerCtx {
  idx: PlannerIndex;
  today: string;
  density: Density;
  readOnly: boolean;
  selection: Set<string>;
  /** Tour ids matching the current search (highlighted). */
  matches: Set<string> | null;
  onTourClick: (tour: Tour, e: MouseEvent) => void;
  onCreate: (prefill: Partial<Tour>) => void;
  openCell: (rect: DOMRect, driverId: string | null, date: string) => void;
  hoverDriver: (driver: Driver | null, rect?: DOMRect) => void;
  checkDrop: (ids: string[], driverId: string | null, date: string) => DropCheck;
  drop: (ids: string[], driverId: string | null, date: string, startMin?: number | null) => void;
  openDay: (date: string) => void;
}

export const Ctx = createContext<PlannerCtx | null>(null);

export const usePlannerCtx = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('usePlannerCtx must be used inside <Planner />');
  return c;
};
