/** Date helpers. Dates are local ISO day strings (YYYY-MM-DD); times are "HH:MM". */

const pad = (n: number) => String(n).padStart(2, '0');

export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const fromISO = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const todayISO = () => toISO(new Date());

export const addDays = (iso: string, n: number) => {
  const d = fromISO(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
};

/** Monday of the week containing `iso`. */
export const startOfWeek = (iso: string) => {
  const d = fromISO(iso);
  const dow = (d.getDay() + 6) % 7;
  return addDays(iso, -dow);
};

export const diffDays = (a: string, b: string) => Math.round((fromISO(a).getTime() - fromISO(b).getTime()) / 86400000);

export const rangeDays = (start: string, end: string) => {
  const out: string[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
  return out;
};

export const isWeekend = (iso: string) => {
  const dow = fromISO(iso).getDay();
  return dow === 0 || dow === 6;
};

export const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export const fromMin = (min: number) => {
  const m = Math.max(0, Math.min(24 * 60 - 1, Math.round(min)));
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
};

export const nowMin = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};

const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) => fromISO(iso).toLocaleDateString('en-GB', opts);

export const fmtWeekday = (iso: string) => fmt(iso, { weekday: 'short' });
export const fmtDayNum = (iso: string) => fmt(iso, { day: 'numeric' });
export const fmtShortDay = (iso: string) => `${fmtWeekday(iso)} ${fmtDayNum(iso)}`;
export const fmtShort = (iso: string) => fmt(iso, { day: 'numeric', month: 'short' });
export const fmtMedium = (iso: string) => fmt(iso, { weekday: 'short', day: 'numeric', month: 'short' });
export const fmtLong = (iso: string) => fmt(iso, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
export const fmtFull = (iso: string) => fmt(iso, { day: 'numeric', month: 'short', year: 'numeric' });

export const fmtRange = (start: string, end: string) => {
  if (start === end) return fmtLong(start);
  const s = fromISO(start);
  const e = fromISO(end);
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  const left = s.toLocaleDateString('en-GB', sameMonth ? { day: 'numeric' } : { day: 'numeric', month: 'short' });
  return `${left} – ${e.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
};

/** Relative wording for doc expiry etc. */
export const fmtRelativeDays = (days: number) => {
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  return days > 0 ? `in ${days} days` : `${-days} days ago`;
};
