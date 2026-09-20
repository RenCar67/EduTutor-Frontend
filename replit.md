# EduTutor

Plataforma SaaS educativa para descubrir tutorías, gestionar sesiones, revisar métricas y auditar eventos desde una sola consola.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite, Tailwind CSS, Wouter, TanStack Query, Recharts-ready workspace

## Where things live

- `artifacts/edututor/src/` — responsive EduTutor console, shared shell, local demo data and module pages
- `artifacts/api-server/src/routes/edututor.ts` — BFF endpoints and enriched in-memory demo contracts
- `lib/api-spec/openapi.yaml` — source of truth for catalog, sessions, analytics and audit contracts
- `lib/api-client-react/src/custom-fetch.ts` — generated client transport with configurable user context headers
- `lib/api-zod/src/generated/` and `lib/api-client-react/src/generated/` — generated validation/types and React Query hooks

## Architecture decisions

- The web app only calls `/api/v1/*` through the BFF contract; microservice boundaries remain behind the API server.
- Mock Mode is enabled by default and uses a richer local dataset so the UI remains demonstrable without a reachable backend.
- Live API requests include `X-User-Id` and `X-User-Role` from the simulated role selector through the shared fetch transport.
- Session lifecycle transitions are validated in the BFF and return a descriptive 409 for illegal transitions.
- The first build uses in-memory BFF data to keep the demo self-contained; PostgreSQL can replace the store without changing the frontend contract.

## Product

- Dashboard with operational KPIs, hourly demand, state distribution and active-session context
- Searchable catalog with category/price filters and scheduling flow
- Session operations table with create flow and validated lifecycle transitions
- Analytics view with hourly/daily metrics and CSV export
- Audit view with event filters and expandable JSON payloads
- Responsive shell with role simulation and Mock Mode ON/OFF

## User preferences

No project-specific preferences recorded.

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after changing `lib/api-spec/openapi.yaml`.
- The frontend artifact workflow supplies `PORT` and `BASE_PATH`; use the managed workflow for previews.
- The API server owns `/api`, while the frontend consumes `/api/v1/...` through the shared proxy.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
