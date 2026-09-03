# Chukta

> Find every traffic challan on your vehicles, flag the wrong ones, and dispute or clear them before your licence is at risk.

A mobile-first PWA + API monorepo. See [`docs/architecture.md`](docs/architecture.md) for the design.

## Stack

React 19 · Vite · React Router 7 · Tailwind v4 · shadcn-style UI · Express 5 · Zod · Prisma · Neon Postgres · Vitest · Playwright.

## Prerequisites

- Node ≥ 20
- A Neon Postgres database (free tier is fine)

## Setup

```bash
npm install

# 1. Add your Neon connection strings (pooled + direct — see the example file)
cp packages/db/.env.example packages/db/.env
#   then edit packages/db/.env and set DATABASE_URL (pooled) and DIRECT_URL (direct)

# 2. Create the schema and seed sample data
npm run db:generate     # generate the Prisma client
npm run db:push         # sync schema to Neon (no shadow DB; fast + reliable)
npm run db:seed         # load 3 sample vehicles + challans

# 3. Run both apps (API on :4000, web on :5173)
npm run dev             # or: npm run dev:api / npm run dev:web
```

Open http://localhost:5173. The web dev server proxies `/api` → `http://localhost:4000`.

## Scripts

| Script | Does |
|---|---|
| `npm run dev` | run API + web together |
| `npm test` | run all workspace unit/integration tests |
| `npm run typecheck` | typecheck every workspace |
| `npm run build` | build shared → db → api → web |
| `npm run db:migrate` / `db:seed` / `db:generate` | Prisma tasks |
| `npm run e2e` | Playwright end-to-end specs |

## Environment variables

| Var | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | `packages/db/.env` | Neon Postgres connection string (required) |
| `VITE_MIXPANEL_TOKEN` | web env | optional; analytics no-op + console.log when unset |
| `VITE_API_BASE` | web env | optional; defaults to `/api` (proxied in dev) |
| `PORT` | api env | optional; API port, defaults to 4000 |

## Ethics

Pro-compliance by design: Chukta surfaces what's legitimately owed and fights
only errors. No pay-to-skip, no cut of legitimate fines, no selling personal
data. Government auto-fetch and live alerts are **labelled simulated previews**
until an official API/data partner exists — the app never scrapes or
auto-submits to government portals.
