# Chukta — Architecture

Chukta helps Indian drivers find, understand, and dispute traffic challans. This
document describes the monorepo, the core-slice implementation, and the
decisions behind it.

## Monorepo

```
apps/
  web/     React 19 + Vite + React Router 7 + Tailwind v4 + shadcn-style UI (mobile-first PWA)
  api/     Express 5 + TypeScript REST API
packages/
  shared/  @chukta/shared — Zod contracts, grounds content, letter generator, deadline math
  db/      @chukta/db — Prisma schema + client (Neon Postgres)
docs/      architecture notes
e2e/       Playwright specs
```

Tooling: **npm workspaces** (pnpm was intended but the sandbox blocks corepack's
global install; npm workspaces are equivalent here). TypeScript everywhere.

## Data ownership & privacy

The build spec's privacy default is on-device storage. This build instead
**persists to the server** (a deliberate, approved deviation) so the data model
can grow. Privacy is preserved another way:

- Every row is scoped by an anonymous **`deviceId`** — a UUID generated once in
  the browser and stored in `localStorage`. There are **no accounts, no login,
  and no PII linkage**. The device id travels in the `x-device-id` header.
- Challan screenshots are stored as data-URL text on the challan/dispute row for
  the owning device only.
- Sample data lives under a reserved `SAMPLE` device id and is merged, read-only,
  into every device's view so the app demos instantly. Writes to `SAMPLE` are
  rejected.

## Shared package is the core IP

`@chukta/shared` holds the logic that must be identical on client and server:

- **Zod schemas** (`schemas.ts`) — the single source of truth for Vehicle,
  Challan, Dispute, and analytics shapes. The API validates request bodies with
  them; the web client parses responses with them.
- **Grounds** (`grounds.ts`) — the five dispute grounds, each with a title,
  evidence checklist, optional extra field, and letter paragraph.
- **Letter generator** (`letter.ts`) — `generateLetter()` is pure and
  deterministic, so the drafter previews exactly what gets saved.
- **Deadline math** (`deadline.ts`) — `daysSince`, `deriveStatus`, the escalation
  timeline, and the Google Calendar reminder URL.

Challan **status is derived, not stored**: `deriveStatus(date)` returns
`overdue` (>60d), `due` (>35d), else `pending`; an explicitly paid challan is
`paid`.

## API

Express 5. All data routes require `x-device-id` and validate bodies with the
shared Zod schemas.

| Method | Route | Purpose |
|---|---|---|
| GET/POST/DELETE | `/vehicles` | device vehicles + sample vehicles |
| GET/POST/DELETE | `/challans` | device challans + sample challans |
| GET/POST/PATCH/DELETE | `/disputes` | user-created disputes (the F1→F3 core) |
| POST | `/analytics` | server-side event sink (console; wire Mixpanel here) |
| GET | `/health` | liveness |

## Web

Mobile-app shell: a max-440px column with a bottom tab bar (Home · Challans ·
Disputes · Pro), Manrope + Space Mono, brand tokens as CSS variables, light/dark
via `prefers-color-scheme`. Installable as a PWA.

Core-slice features implemented: **F1** dispute drafter (3 steps), **F2**
deadline guardian (timeline, days-left chip, calendar link), **F3** disputes
tracker (persisted). Home/Challans surface sample data and pre-fill the drafter
ground from a flagged challan (a taste of F4/F5); F6/F8 appear as labelled
previews. Analytics (F7) fire client-side via `lib/analytics.ts`.

## Testing

- **Vitest** unit tests for `@chukta/shared` (letter + deadline + schema logic).
- **Supertest** tests for the API routes with Prisma mocked (no DB needed).
- **React Testing Library** for the drafter flow.
- **Playwright** E2E for the definition-of-done path (see `e2e/`).
