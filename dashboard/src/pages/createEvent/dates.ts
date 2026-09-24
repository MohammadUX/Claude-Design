const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WD_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const MONTH_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export const parse = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const toIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** "Mon, Nov 11" */
export const shortDate = (iso: string) => {
  const d = parse(iso)
  return `${WD[d.getDay()]}, ${MON[d.getMonth()]} ${d.getDate()}`
}
/** "Jul 12, 2026" */
export const mediumDate = (iso: string) => {
  const d = parse(iso)
  return `${MON[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}
/** "Saturday, 3 Oct 2026" */
export const longDate = (iso: string) => {
  const d = parse(iso)
  return `${WD_LONG[d.getDay()]}, ${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`
}
export const monthDay = (iso: string) => {
  const d = parse(iso)
  return { month: MON[d.getMonth()], day: String(d.getDate()) }
}

/** 600 → "10.00 AM" (PAAQ writes times with a dot). */
export const time = (minutes: number) => {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const ap = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}.${String(m).padStart(2, '0')} ${ap}`
}

/** Card format used across the prototype: "Sat, Jul 4, 2026.  7.00 PM". */
export const cardDate = (iso: string, minutes: number) => {
  const d = parse(iso)
  return `${WD[d.getDay()]}, ${MON[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}.  ${time(minutes)}`
}

export const stamp = (p: { date: string; minutes: number }) => parse(p.date).getTime() + p.minutes * 60_000

export const addDays = (iso: string, n: number) => {
  const d = parse(iso)
  d.setDate(d.getDate() + n)
  return toIso(d)
}
