# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod, drizzle-zod
- **Build**: esbuild (ESM bundle)

## Artifacts

### Samikaran Olympiad (`artifacts/samikaran-olympiad`)
- Frontend React + Vite app (TypeScript, Tailwind CSS v3, wouter, TanStack Query)
- Preview path: `/` (root)
- Port: assigned via `PORT` env var
- Ported from `.migration-backup/` original single-file Express app

### API Server (`artifacts/api-server`)
- Express 5 backend serving `/api/*` routes
- WebSocket support: `/sysctrl/ws`, `/support/ws`, `/terminal/ws`
- Object storage routes: `/objects/*`
- Port: 8080
- Entry point: `src/index.ts` → builds to `dist/index.mjs` via esbuild

### Mockup Sandbox (`artifacts/mockup-sandbox`)
- Design/component preview sandbox

## Key Packages

### `lib/db`
- Drizzle ORM schema at `src/schema/schema.ts`
- Models: `src/schema/models/auth.ts`, `src/schema/models/chat.ts`
- Push schema: `pnpm --filter @workspace/db run push`

### `artifacts/api-server/src/`
- `index.ts` — entry point with Express/WebSocket/HTTP server init
- `routes/routes.ts` — main routes file (~16K lines)
- `shared-routes.ts` — shared route type definitions (from original `shared/routes.ts`)
- `exam-lifecycle.ts` — exam state machine logic
- `models/auth.ts`, `models/chat.ts` — shared model types
- `replit_integrations/object_storage/` — object storage integration

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Notes

- React-icons v5: LinkedIn icon is `FaLinkedin` from `react-icons/fa` (not `SiLinkedin`)
- Object storage route uses Express 5 wildcard syntax: `/objects/{*objectPath}`
- Dynamic imports in `routes/routes.ts` use `../` prefix (parent directory) not `./`
- Tailwind CSS v3 with `postcss.config.js` + `tailwind.config.ts`
- DB schema push may prompt interactively for unique constraint additions — apply directly via SQL if needed

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
