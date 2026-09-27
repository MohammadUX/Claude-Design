/**
 * Planner config — the ONE place for status, document and absence rules + colors.
 * Every component reads from here; change a rule or a color once and it propagates.
 * Colors were checked for WCAG AA (≥ 4.5:1) as 12px text on the card surface (#161616).
 */
import {
  Ban,
  CalendarCheck,
  CircleCheck,
  CircleDashed,
  ClockAlert,
  Navigation,
  Thermometer,
  TreePalm,
  UserX,
  type LucideIcon,
} from 'lucide-react';

/* ------------------------------------------------------------------ Brand */

export const BRAND = {
  orange: '#FF6A2B',
  /** Text on the orange CTA. Dark text keeps AA contrast (6.9:1); white on orange fails AA. */
  onOrange: '#140B06',
};

/* ------------------------------------------------------------- Tour status */

export type TourStatus = 'draft' | 'assigned' | 'in_transit' | 'delayed' | 'completed' | 'cancelled';

export interface StatusDef {
  label: string;
  /** Solid color used for the card bar, dot and label text. */
  color: string;
  /** Tinted background for badges. */
  bg: string;
  icon: LucideIcon;
  /** Whether a tour in this status occupies its driver / vehicles. */
  occupies: boolean;
  /** Whether a tour in this status can still be dragged / edited freely. */
  editable: boolean;
}

export const TOUR_STATUS: Record<TourStatus, StatusDef> = {
  draft: {
    label: 'Draft',
    color: '#B4B4BC',
    bg: 'rgba(180,180,188,0.12)',
    icon: CircleDashed,
    occupies: true,
    editable: true,
  },
  assigned: {
    label: 'Assigned',
    color: '#7DB3FF',
    bg: 'rgba(125,179,255,0.13)',
    icon: CalendarCheck,
    occupies: true,
    editable: true,
  },
  in_transit: {
    label: 'In transit',
    color: '#4ADE80',
    bg: 'rgba(74,222,128,0.12)',
    icon: Navigation,
    occupies: true,
    editable: true,
  },
  delayed: {
    label: 'Delayed',
    color: '#FF7A7A',
    bg: 'rgba(255,122,122,0.13)',
    icon: ClockAlert,
    occupies: true,
    editable: true,
  },
  completed: {
    label: 'Completed',
    color: '#A3B3C4',
    bg: 'rgba(163,179,196,0.12)',
    icon: CircleCheck,
    occupies: true,
    editable: false,
  },
  cancelled: {
    label: 'Cancelled',
    color: '#9A9AA2',
    bg: 'rgba(154,154,162,0.10)',
    icon: Ban,
    occupies: false,
    editable: true,
  },
};

/** Lifecycle order, used by the status picker in the side panel. */
export const TOUR_STATUS_FLOW: TourStatus[] = ['draft', 'assigned', 'in_transit', 'delayed', 'completed', 'cancelled'];

/* ------------------------------------------------------- Driver documents */

export type DocKey = 'license' | 'cqc' | 'tacho';

export const DOCS: { key: DocKey; label: string; short: string }[] = [
  { key: 'license', label: 'License', short: 'LIC' },
  { key: 'cqc', label: 'CQC', short: 'CQC' },
  { key: 'tacho', label: 'Tachograph card', short: 'TAC' },
];

export const DOC_RULES = {
  /** A document is "expiring" when it expires within this many days of the reference date. */
  expiringWithinDays: 30,
  /** An expired document blocks the driver from being assigned on that day. */
  expiredBlocksAssignment: true,
};

export type DocState = 'ok' | 'expiring' | 'expired';

export const DOC_STATE: Record<DocState, { label: string; color: string; bg: string }> = {
  ok: { label: 'Valid', color: '#4ADE80', bg: 'rgba(74,222,128,0.12)' },
  expiring: { label: 'Expiring', color: '#FBBF24', bg: 'rgba(251,191,36,0.13)' },
  expired: { label: 'Expired', color: '#FF7A7A', bg: 'rgba(255,122,122,0.13)' },
};

/* ---------------------------------------------------------------- Absence */

export type AbsenceReason = 'holiday' | 'sick' | 'other';

export const ABSENCE: Record<AbsenceReason, { label: string; icon: LucideIcon }> = {
  holiday: { label: 'Holiday', icon: TreePalm },
  sick: { label: 'Sick leave', icon: Thermometer },
  other: { label: 'Absent', icon: UserX },
};

/* ------------------------------------------------------ Issue severities */

export const SEVERITY = {
  error: { color: '#FF7A7A', bg: 'rgba(255,122,122,0.12)' },
  warning: { color: '#FBBF24', bg: 'rgba(251,191,36,0.12)' },
};

/* --------------------------------------------------------- Layout / views */

export const DENSITY = {
  compact: { rowHeight: 64, label: 'Compact' },
  comfortable: { rowHeight: 100, label: 'Comfortable' },
} as const;
export type Density = keyof typeof DENSITY;

export const DAY_VIEW = {
  startHour: 5,
  endHour: 22,
  hourWidth: 96,
  /** Gaps between tours shorter than this are not labelled as "Free". */
  minFreeGapMin: 90,
  /** Drag snapping in the day view. */
  snapMin: 15,
  /** Duration given to a tour dropped on the timeline without times. */
  defaultDurationMin: 8 * 60,
};

export const WEEK_VIEW = {
  driverColWidth: 248,
  dayColMinWidth: 140,
};

/* ----------------------------------------------------------------- Filters */

export type FilterKey = 'all' | 'available' | 'busy' | 'absent' | 'docIssues' | 'delayed' | 'issues';

export const FILTERS: { key: FilterKey; label: string; hint: string }[] = [
  { key: 'all', label: 'All', hint: 'All drivers' },
  { key: 'available', label: 'Available', hint: 'Has at least one free, assignable day in the period' },
  { key: 'busy', label: 'Busy', hint: 'Has at least one tour in the period' },
  { key: 'absent', label: 'Absent', hint: 'Absent at least one day in the period' },
  { key: 'docIssues', label: 'Doc issues', hint: `A document expired or expiring within ${DOC_RULES.expiringWithinDays} days` },
  { key: 'delayed', label: 'Delayed', hint: 'Has a delayed tour in the period' },
];

export type GroupBy = 'none' | 'depot' | 'vehicleType';

export const GROUP_BY: { key: GroupBy; label: string }[] = [
  { key: 'none', label: 'None' },
  { key: 'depot', label: 'Depot' },
  { key: 'vehicleType', label: 'Vehicle type' },
];
