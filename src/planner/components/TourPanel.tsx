import {
  ArrowDown,
  ArrowUp,
  Ban,
  Building2,
  CalendarDays,
  Container,
  Copy,
  CopyPlus,
  GripVertical,
  MoreHorizontal,
  Plus,
  Repeat,
  Trash2,
  TriangleAlert,
  Truck,
  User,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { normalizeStatus } from '../actions';
import { SEVERITY, TOUR_STATUS, TOUR_STATUS_FLOW, type TourStatus } from '../config';
import { addDays, diffDays, fmtLong, fmtMedium, toMin } from '../date';
import { CITIES } from '../mock';
import {
  driverAvailability,
  driverName,
  getIndex,
  hasRoute,
  isComplete,
  tourIssues,
  vehicleAvailability,
  type Availability,
} from '../selectors';
import { usePlannerStore } from '../store';
import type { Stop, Tour } from '../types';
import { Menu, SmartSelect, StatusBadge, type SmartOption } from './ui';

export type PanelState = { mode: 'edit'; id: string } | { mode: 'new'; prefill: Partial<Tour> } | null;

type Form = Omit<Tour, 'id'>;

let stopSeq = 0;
const newStop = (city = ''): Stop => ({ id: `new-${++stopSeq}`, city });

const toOption = (a: Availability) => ({ state: a.state, reason: a.state === 'available' ? undefined : a.reason });

export function TourPanel({
  panel,
  onClose,
  readOnly,
  onDirtyChange,
  pendingDiscard,
  onResolvePending,
}: {
  panel: Exclude<PanelState, null>;
  onClose: () => void;
  readOnly: boolean;
  onDirtyChange: (dirty: boolean) => void;
  pendingDiscard: boolean;
  onResolvePending: (discard: boolean) => void;
}) {
  const data = usePlannerStore((s) => s.data);
  const store = usePlannerStore.getState();
  const idx = getIndex(data);
  const existing = panel.mode === 'edit' ? idx.tourById.get(panel.id) : undefined;

  const initial = useMemo<Form>(() => {
    if (existing) {
      const { id: _id, ...rest } = existing;
      return { ...rest, stops: rest.stops.map((s) => ({ ...s })) };
    }
    const p = panel.mode === 'new' ? panel.prefill : {};
    const date = p.date ?? new Date().toISOString().slice(0, 10);
    const d = p.driverId ? idx.driverById.get(p.driverId) : undefined;
    const origin = d ? idx.depotById.get(d.depotId)?.city ?? '' : '';
    const form: Form = { date, driverId: p.driverId, start: p.start, end: p.end, stops: [newStop(origin), newStop()], status: 'draft' };
    const probe = { ...form, id: '__new' };
    if (d?.defaultTractorId && vehicleAvailability(idx, d.defaultTractorId, 'tractorId', probe).state === 'available') form.tractorId = d.defaultTractorId;
    if (d?.defaultTrailerId && vehicleAvailability(idx, d.defaultTrailerId, 'trailerId', probe).state === 'available') form.trailerId = d.defaultTrailerId;
    return form;
    // Recompute only when a different tour / prefill opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panel]);

  const [form, setForm] = useState<Form>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [menu, setMenu] = useState<DOMRect | null>(null);
  const [dragStop, setDragStop] = useState<number | null>(null);

  useEffect(() => {
    setForm(initial);
    setErrors({});
  }, [initial]);

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);

  const locked = readOnly || (existing ? !TOUR_STATUS[existing.status].editable : false);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const probe: Tour = { ...form, id: existing?.id ?? '__new' };

  /* ------------------------------------------------------ Smart options */
  const driverOptions: SmartOption[] = useMemo(
    () =>
      data.drivers.map((d) => {
        const a = driverAvailability(idx, d, probe);
        const depot = idx.depotById.get(d.depotId);
        const tractor = d.defaultTractorId ? idx.tractorById.get(d.defaultTractorId)?.plate : undefined;
        return { value: d.id, label: driverName(d), sub: [depot?.city, tractor].filter(Boolean).join(' · '), ...toOption(a) };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, form.date, form.start, form.end],
  );

  const driver = form.driverId ? idx.driverById.get(form.driverId) : undefined;
  const vehicleOptions = (key: 'tractorId' | 'trailerId'): SmartOption[] => {
    const list = key === 'tractorId' ? data.tractors : data.trailers;
    const def = key === 'tractorId' ? driver?.defaultTractorId : driver?.defaultTrailerId;
    const opts = list.map((v) => {
      const a = vehicleAvailability(idx, v.id, key, probe);
      return {
        value: v.id,
        label: v.plate,
        sub: `${'model' in v ? v.model : v.type} · ${idx.depotById.get(v.depotId)?.city}`,
        badge: v.id === def ? 'Default' : undefined,
        ...toOption(a),
      } as SmartOption;
    });
    return opts.sort((a, b) => (a.badge ? -1 : b.badge ? 1 : 0));
  };

  const clientOptions: SmartOption[] = data.clients.map((c) => ({ value: c.id, label: c.name, state: 'available' }));

  /* ------------------------------------------------------------ Stops */
  const setStop = (i: number, patch: Partial<Stop>) => set('stops', form.stops.map((s, j) => (i === j ? { ...s, ...patch } : s)));
  const moveStop = (from: number, to: number) => {
    if (to < 0 || to >= form.stops.length) return;
    const next = [...form.stops];
    const [s] = next.splice(from, 1);
    next.splice(to, 0, s);
    set('stops', next);
  };
  const addStop = () => set('stops', [...form.stops.slice(0, -1), newStop(), form.stops.at(-1)!]);
  const removeStop = (i: number) => set('stops', form.stops.filter((_, j) => j !== i));

  /* ------------------------------------------------------------ Save */
  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.date) e.date = 'Pick a date';
    if (!hasRoute(probe)) e.stops = 'Add at least an origin and a destination';
    const multi = !!form.endDate && form.endDate > form.date;
    if (form.endDate && form.endDate < form.date) e.endDate = 'Arrival day must be on or after the departure day';
    if (!multi && form.start && form.end && toMin(form.end) <= toMin(form.start)) e.end = 'Arrival time must be after departure';
    if (!multi && ((form.start && !form.end) || (!form.start && form.end))) e.end = 'Set both times, or neither';
    if (driver) {
      const a = driverAvailability(idx, driver, probe);
      if (a.state === 'unavailable' && existing?.driverId !== driver.id) e.driverId = a.reason;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const clean = (f: Form): Form => ({ ...f, stops: f.stops.filter((s, i) => s.city.trim() || i === 0 || i === f.stops.length - 1), notes: f.notes?.trim() || undefined });

  const save = (asDraft: boolean) => {
    if (!asDraft && !validate()) return;
    let tour: Tour = { ...clean(form), id: existing?.id ?? '' };
    tour = asDraft ? { ...tour, status: 'draft', delayMin: undefined } : normalizeStatus(tour);
    if (tour.status !== 'delayed') tour.delayMin = undefined;
    const incomplete = !asDraft && tour.status === 'draft';
    const msg = asDraft
      ? 'Saved as draft'
      : incomplete
        ? `Saved as draft · ${!tour.driverId ? 'no driver yet' : !isComplete(tour) ? 'vehicle missing' : ''}`
        : existing
          ? 'Tour updated'
          : `Tour created for ${driverName(driver)} · ${fmtMedium(tour.date)}`;
    if (existing) store.saveTour(tour, msg);
    else {
      const { id: _id, ...rest } = tour;
      store.createTours([rest], msg);
    }
    onDirtyChange(false);
    onClose();
  };

  const run = (fn: () => void) => {
    onDirtyChange(false);
    fn();
    onClose();
  };

  useEffect(() => {
    document.getElementById('f-driver')?.focus({ preventScroll: true });
  }, [panel]);

  // Esc closes the panel (unless a popover inside it is open).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || document.querySelector('.popover')) return;
      e.preventDefault();
      onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const issues = existing ? tourIssues(idx, existing.id) : [];
  const title = existing ? existing.id : 'New tour';

  return (
    <aside className="panel" role="dialog" aria-label={existing ? `Edit tour ${existing.id}` : 'New tour'}>
      <header className="panel__head">
        <div>
          <div className="panel__eyebrow">{existing ? 'Tour' : 'Create'}</div>
          <h2 className="panel__title">
            {title}
            {existing && <StatusBadge status={existing.status} delayMin={existing.delayMin} />}
            {dirty && <span className="panel__dirty">Unsaved changes</span>}
          </h2>
          <div className="panel__sub">{form.endDate && form.endDate > form.date ? `${fmtMedium(form.date)} → ${fmtMedium(form.endDate)}` : fmtLong(form.date)}</div>
        </div>
        <button className="iconbtn" onClick={onClose} aria-label="Close panel" data-tip="Close (Esc)">
          <X size={18} />
        </button>
      </header>

      {pendingDiscard && (
        <div className="panel__confirm" role="alertdialog" aria-label="Unsaved changes">
          <TriangleAlert size={16} />
          <span>You have unsaved changes. Discard them?</span>
          <button className="btn btn--ghost btn--sm" onClick={() => onResolvePending(false)}>
            Keep editing
          </button>
          <button className="btn btn--danger btn--sm" onClick={() => onResolvePending(true)}>
            Discard
          </button>
        </div>
      )}

      <div className="panel__body">
        {issues.length > 0 && (
          <ul className="panel__issues">
            {issues.map((i) => (
              <li key={i.message} style={{ color: SEVERITY[i.severity].color, background: SEVERITY[i.severity].bg }}>
                <TriangleAlert size={14} aria-hidden /> {i.message}
              </li>
            ))}
          </ul>
        )}
        {locked && !readOnly && <div className="panel__note">Completed tours are read-only. Duplicate it to plan a similar tour.</div>}

        <fieldset className="panel__fields" disabled={locked}>
          <section className="fsection">
            <h3>Crew & vehicles</h3>
            <div className="field">
              <label htmlFor="f-driver">Driver</label>
              <SmartSelect
                id="f-driver"
                value={form.driverId}
                options={driverOptions}
                placeholder="Unassigned — pick a driver"
                icon={User}
                invalid={!!errors.driverId}
                onChange={(v) => {
                  const d = v ? idx.driverById.get(v) : undefined;
                  setForm((f) => {
                    const next = { ...f, driverId: v };
                    const p = { ...next, id: probe.id };
                    if (d?.defaultTractorId && !f.tractorId && vehicleAvailability(idx, d.defaultTractorId, 'tractorId', p).state === 'available') next.tractorId = d.defaultTractorId;
                    if (d?.defaultTrailerId && !f.trailerId && vehicleAvailability(idx, d.defaultTrailerId, 'trailerId', p).state === 'available') next.trailerId = d.defaultTrailerId;
                    return next;
                  });
                  setErrors((e) => ({ ...e, driverId: '' }));
                }}
              />
              {errors.driverId && <p className="field__error">{errors.driverId}</p>}
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="f-tractor">Tractor</label>
                <SmartSelect id="f-tractor" value={form.tractorId} options={vehicleOptions('tractorId')} placeholder="Tractor to assign" icon={Truck} onChange={(v) => set('tractorId', v)} />
              </div>
              <div className="field">
                <label htmlFor="f-trailer">Semi-trailer</label>
                <SmartSelect id="f-trailer" value={form.trailerId} options={vehicleOptions('trailerId')} placeholder="Trailer to assign" icon={Container} onChange={(v) => set('trailerId', v)} />
              </div>
            </div>
          </section>

          <section className="fsection">
            <h3>When</h3>
            <div className="field-row">
              <div className="field">
                <label htmlFor="f-date">Leaves on</label>
                <div className="field__control input-icon">
                  <CalendarDays size={15} aria-hidden />
                  <input
                    id="f-date"
                    type="date"
                    value={form.date}
                    onChange={(e) => {
                      const d = e.target.value;
                      // Keep the trip length when the start day moves.
                      const len = form.endDate ? diffDays(form.endDate, form.date) : 0;
                      setForm((f) => ({ ...f, date: d, endDate: len > 0 && d ? addDays(d, len) : undefined }));
                      setErrors((er) => ({ ...er, date: '', endDate: '' }));
                    }}
                    required
                  />
                </div>
                {errors.date && <p className="field__error">{errors.date}</p>}
              </div>
              <div className="field">
                <label htmlFor="f-start">
                  at <span className="field__opt">optional</span>
                </label>
                <input id="f-start" className="field__control" type="time" step={900} value={form.start ?? ''} onChange={(e) => set('start', e.target.value || undefined)} />
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="f-enddate">
                  Arrives on <span className="field__opt">same day if empty</span>
                </label>
                <div className={`field__control input-icon ${errors.endDate ? 'is-invalid' : ''}`}>
                  <CalendarDays size={15} aria-hidden />
                  <input id="f-enddate" type="date" min={form.date} value={form.endDate ?? ''} onChange={(e) => set('endDate', e.target.value && e.target.value !== form.date ? e.target.value : undefined)} />
                </div>
              </div>
              <div className="field">
                <label htmlFor="f-end">
                  at <span className="field__opt">optional</span>
                </label>
                <input id="f-end" className={`field__control ${errors.end ? 'is-invalid' : ''}`} type="time" step={900} value={form.end ?? ''} onChange={(e) => set('end', e.target.value || undefined)} />
              </div>
            </div>
            {errors.endDate && <p className="field__error">{errors.endDate}</p>}
            {errors.end && <p className="field__error">{errors.end}</p>}
            {form.endDate && form.endDate > form.date ? (
              <p className="field__help">
                {diffDays(form.endDate, form.date) + 1}-day tour · the driver and vehicles are booked every day from {fmtMedium(form.date)} to {fmtMedium(form.endDate)}.
              </p>
            ) : (
              !form.start && !form.end && <p className="field__help">No times: the tour sits in the “No time set” lane.</p>
            )}
          </section>

          <section className="fsection">
            <h3>Route</h3>
            <ol className="stops" onDragOver={(e) => dragStop !== null && e.preventDefault()}>
              {form.stops.map((s, i) => {
                const role = i === 0 ? 'Origin' : i === form.stops.length - 1 ? 'Destination' : `Stop ${i}`;
                return (
                  <li
                    key={s.id}
                    className={`stop ${dragStop === i ? 'is-dragging' : ''}`}
                    onDragOver={(e) => {
                      if (dragStop === null || dragStop === i) return;
                      e.preventDefault();
                      moveStop(dragStop, i);
                      setDragStop(i);
                    }}
                  >
                    <span
                      className="stop__grip"
                      draggable={!locked}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', 'stop');
                        setDragStop(i);
                      }}
                      onDragEnd={() => setDragStop(null)}
                      aria-hidden
                    >
                      <GripVertical size={14} />
                    </span>
                    <span className={`stop__marker ${i === 0 ? 'is-origin' : i === form.stops.length - 1 ? 'is-dest' : ''}`}>{String.fromCharCode(65 + i)}</span>
                    <div className="stop__fields">
                      <input
                        className={`field__control ${errors.stops && !s.city.trim() ? 'is-invalid' : ''}`}
                        list="city-list"
                        placeholder={`${role} city`}
                        aria-label={`${role} city`}
                        value={s.city}
                        onChange={(e) => setStop(i, { city: e.target.value })}
                      />
                      <input className="field__control field__control--sub" placeholder="Address (optional)" aria-label={`${role} address`} value={s.address ?? ''} onChange={(e) => setStop(i, { address: e.target.value || undefined })} />
                    </div>
                    <div className="stop__actions">
                      <button type="button" className="iconbtn iconbtn--sm" onClick={() => moveStop(i, i - 1)} disabled={i === 0} aria-label={`Move ${role} up`}>
                        <ArrowUp size={14} />
                      </button>
                      <button type="button" className="iconbtn iconbtn--sm" onClick={() => moveStop(i, i + 1)} disabled={i === form.stops.length - 1} aria-label={`Move ${role} down`}>
                        <ArrowDown size={14} />
                      </button>
                      <button type="button" className="iconbtn iconbtn--sm" onClick={() => removeStop(i)} disabled={form.stops.length <= 2} aria-label={`Remove ${role}`}>
                        <X size={14} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
            {errors.stops && <p className="field__error">{errors.stops}</p>}
            <button type="button" className="btn btn--ghost btn--sm" onClick={addStop}>
              <Plus size={14} /> Add stop
            </button>
            <datalist id="city-list">
              {CITIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </section>

          <section className="fsection">
            <h3>Details</h3>
            <div className="field">
              <label htmlFor="f-client">Client</label>
              <SmartSelect id="f-client" value={form.clientId} options={clientOptions} placeholder="Select client" icon={Building2} onChange={(v) => set('clientId', v)} />
            </div>
            <div className="field">
              <span className="field__label" id="f-status">
                Status
              </span>
              <div className="statuspick" role="radiogroup" aria-labelledby="f-status">
                {TOUR_STATUS_FLOW.map((k: TourStatus) => {
                  const S = TOUR_STATUS[k];
                  return (
                    <button
                      type="button"
                      key={k}
                      role="radio"
                      aria-checked={form.status === k}
                      className={`statuspick__opt ${form.status === k ? 'is-active' : ''}`}
                      style={{ ['--status' as string]: S.color, ['--status-bg' as string]: S.bg }}
                      onClick={() => set('status', k)}
                    >
                      <S.icon size={13} strokeWidth={2.4} aria-hidden /> {S.label}
                    </button>
                  );
                })}
              </div>
            </div>
            {form.status === 'delayed' && (
              <div className="field">
                <label htmlFor="f-delay">Delay (minutes)</label>
                <input id="f-delay" className="field__control" type="number" min={5} step={5} value={form.delayMin ?? ''} onChange={(e) => set('delayMin', Number(e.target.value) || undefined)} />
              </div>
            )}
            <div className="field">
              <label htmlFor="f-notes">Notes</label>
              <textarea id="f-notes" className="field__control" rows={3} placeholder="Loading instructions, references, contacts…" value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
            </div>
          </section>
        </fieldset>
      </div>

      {!readOnly && (
        <footer className="panel__foot">
          {existing && (
            <>
              <button className="iconbtn" onClick={(e) => setMenu(e.currentTarget.getBoundingClientRect())} aria-label="More actions" data-tip="More actions">
                <MoreHorizontal size={18} />
              </button>
              {menu && (
                <Menu
                  anchor={menu}
                  onClose={() => setMenu(null)}
                  placement="bottom-start"
                  items={[
                    { label: 'Duplicate', icon: Copy, onClick: () => run(() => store.copyTours([existing.id], [0], 'Tour duplicated')) },
                    { label: 'Copy to next day', icon: CopyPlus, onClick: () => run(() => store.copyTours([existing.id], [1], `Tour copied to ${fmtMedium(addDays(existing.date, 1))}`)) },
                    { label: 'Repeat weekly (next 4 weeks)', icon: Repeat, onClick: () => run(() => store.copyTours([existing.id], [7, 14, 21, 28], 'Tour repeated weekly · 4 copies')) },
                    'sep',
                    {
                      label: 'Cancel tour',
                      icon: Ban,
                      disabled: existing.status === 'cancelled' || existing.status === 'completed',
                      onClick: () => run(() => store.updateTours([existing.id], (t) => ({ ...t, status: 'cancelled', delayMin: undefined }), 'Tour cancelled')),
                    },
                    { label: 'Delete tour', icon: Trash2, danger: true, onClick: () => run(() => store.deleteTours([existing.id])) },
                  ]}
                />
              )}
            </>
          )}
          <span className="panel__spacer" />
          <button className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn--secondary" onClick={() => save(true)} disabled={locked}>
            Save as draft
          </button>
          <button className="btn btn--primary" onClick={() => save(false)} disabled={locked}>
            {existing ? 'Save' : 'Create tour'}
          </button>
        </footer>
      )}
    </aside>
  );
}

