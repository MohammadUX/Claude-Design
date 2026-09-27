import type { AbsenceReason, DocKey, TourStatus } from './config';

export interface Depot {
  id: string;
  name: string;
  city: string;
}

export interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  depotId: string;
  defaultTractorId?: string;
  defaultTrailerId?: string;
  /** Expiry dates (ISO). */
  docs: Record<DocKey, string>;
}

export interface Tractor {
  id: string;
  plate: string;
  model: string;
  depotId: string;
}

export type TrailerType = 'Tautliner' | 'Reefer' | 'Box' | 'Flatbed' | 'Tanker';

export interface Trailer {
  id: string;
  plate: string;
  type: TrailerType;
  depotId: string;
}

export interface Client {
  id: string;
  name: string;
}

export interface Absence {
  id: string;
  driverId: string;
  from: string;
  to: string;
  reason: AbsenceReason;
  note?: string;
}

export interface Maintenance {
  id: string;
  vehicleId: string;
  from: string;
  to: string;
  note: string;
}

export interface Stop {
  id: string;
  city: string;
  address?: string;
}

export interface Tour {
  id: string;
  /** Day the tour leaves. */
  date: string;
  /** Day the tour arrives, for multi-day tours (inclusive). Omitted = same day. */
  endDate?: string;
  driverId?: string;
  tractorId?: string;
  trailerId?: string;
  start?: string;
  end?: string;
  stops: Stop[];
  clientId?: string;
  notes?: string;
  status: TourStatus;
  /** Minutes of delay; only meaningful when status === 'delayed'. */
  delayMin?: number;
}

export interface PlannerData {
  depots: Depot[];
  drivers: Driver[];
  tractors: Tractor[];
  trailers: Trailer[];
  clients: Client[];
  absences: Absence[];
  maintenance: Maintenance[];
  tours: Tour[];
}

export type IssueKind =
  | 'missing_vehicle'
  | 'missing_route'
  | 'driver_conflict'
  | 'vehicle_conflict'
  | 'driver_absent'
  | 'driver_blocked'
  | 'vehicle_maintenance';

export interface Issue {
  kind: IssueKind;
  severity: 'error' | 'warning';
  message: string;
}
