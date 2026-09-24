# PAAQ — Event Management Prototype

Clickable prototype of the PAAQ event product, built from the Figma file.

## Dashboard (`/dashboard`)

React + Vite + TypeScript + Tailwind, Hugeicons, mock data (no backend).

```bash
cd dashboard
npm install
npm run dev   # http://localhost:5173/events
```

| Screen | Route | Status |
| --- | --- | --- |
| Events (Explore) | `/events` | Built: search popup, filter, carousels, save, follow |
| Create event | `/events/create` | Waiting on designs |
| Event details (public) | `/events/:id` | Built: sticky poster, poster-tinted gradient, confirm pop-up, locked guest list |
| Event space (after registration) | `/events/:id/space` | Built: Overview, Participants, Engagements, Resources tabs; community channel |
| Live event room | `/events/:id/live` | Next flow |

Photos and the PAAQ logo are placeholders until the Figma image assets can be exported.
