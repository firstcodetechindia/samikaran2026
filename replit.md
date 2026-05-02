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

### Samikaran Mobile (`artifacts/samikaran-mobile`)
- Expo React Native app (TypeScript, expo-router v6, TanStack Query)
- Preview path: `/samikaran-mobile/`
- Key packages: expo-camera, expo-face-detector, expo-av, expo-haptics, expo-linear-gradient
- Exam proctoring screens:
  - `app/exam-check.tsx` — pre-exam check (camera/mic permissions, face detection, rules)
  - `app/exam-take.tsx` — full proctored exam (MCQ/True-False/Image/Voice questions, camera overlay, AppState tab-switch detection, expo-av siren, auto-submit at 3 violations, question palette bottom sheet)
- Face detection: snapshot-based via `CameraView.takePictureAsync` + `FaceDetector.detectFacesAsync` every 2s
- Student flow: `(student)/exams.tsx` → `exam-check.tsx` → `exam-take.tsx`

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
