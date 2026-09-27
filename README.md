# Fleeex — Planner prototype

Clickable prototype of the Planner page (React + TypeScript + Vite, mock data only, no backend).

```bash
npm install
npm run dev        # http://localhost:5173
```

## Dev state switcher
Add `?state=<name>` to the URL (or `?dev`, or press **Shift + D**):
`default` · `loading` · `error` (Retry recovers) · `empty` · `no-tours` · `no-results` · `conflict`.
Absences, expiring/expired documents, drafts, delayed/completed/cancelled tours and double-bookings are all in the default data.

## Scale
Built for ~100 drivers (the mock uses 100). Rows are virtualized, so scrolling stays smooth.

## Views
- **Day** (default) — the existing Fleeex pattern: each driver with their documents and live status on the left, that day's tour cards to the right, "+ Add tour" at the end. "Waiting for a driver" is pinned on top.
- **Timeline** — the same day hour by hour, with a live "now" line.
- **Week** — seven days per driver, multi-day tours as one bar.

## Structure
```
src/planner/
  config.ts      ← statuses, document rules, absence types, colors, grid sizes (single source of truth)
  types.ts       ← Driver, Tour, Tractor, Trailer, Absence…
  mock.ts        ← seeded mock data relative to today (100 drivers, 3 depots, 80 tractors, 90 trailers)
  store.ts       ← zustand store: data + mutations + undo + toast (swap load() for a real API)
  selectors.ts   ← pure logic: doc states, availability, conflicts/issues, summaries, drop validation
  actions.ts     ← move/assign rules (status transitions, default vehicles), drag state
  components/    ← Planner, WeekGrid, DayGrid, TourCard, TourPanel, ui primitives
src/app/         ← app shell (top nav), toasts
src/dev/         ← state switcher
```

## `<Planner />` props (widget-ready)
| prop | type | default |
|---|---|---|
| `view` | `'board' \| 'day' \| 'week'` | `'board'` |
| `date` | ISO date anchor | today |
| `range` | `{ start, end }` custom columns (≤14 days) | Mon–Sun |
| `compact` | boolean | comfortable |
| `maxRows` / `openPlannerHref` | number / string — limits rows and shows "Open planner →" | – |
| `filter` | `'all' \| 'available' \| 'busy' \| 'absent' \| 'docIssues' \| 'delayed' \| 'issues'` | `'all'` |
| `readOnly` | boolean | false |
| `showHeader`, `showToolbar`, `showSummary`, `showUnassigned` | boolean | true |
| `enableShortcuts` | boolean | true |

Example dashboard widget: `<Planner compact maxRows={8} filter="issues" readOnly showToolbar={false} enableShortcuts={false} openPlannerHref="/planner" />`

## Keyboard
← → period · T today · N new tour · / search · Esc close · Shift/⌘-click multi-select · ⌘/Ctrl+Z undo

## Multi-day tours
A tour can run over several days (`endDate`, inclusive). It is indexed on every day it covers, so busy counts, double-booking, absences, expired documents and vehicle availability all apply to each day.
- Week view: one bar across the days (dashed edge when it continues outside the visible week).
- Day view: the bar fills the day with "Day 3 of 5"; the first/last day start/end at the real times.
- Drag & drop keeps the day you grabbed under the pointer and checks the whole trip range.

## Assumptions
- No Figma link was provided; visual tokens were taken from the Figma dashboard screenshot.
- Orange CTA uses dark text (white on orange fails WCAG AA).
- A driver can do several tours per day; only **overlapping times** block a driver. Vehicles used by another driver the same day are blocked.
- Expired document blocks assignment from the day after expiry; "expiring" = ≤30 days.
- "Available" filter = at least one free, assignable day in the visible period.
- Assigning a tour without vehicles auto-fills the driver's default tractor/trailer when free.
- Completed tours are read-only; moving an in-transit/delayed tour to another day re-plans it as Assigned.
