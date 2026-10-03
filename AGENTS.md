# AGENTS.md

## Project Overview

MarketList is a mobile-first inventory and sales management app for small businesses. Two packages (not an npm workspace — install/run each separately): `client/` (Ionic React + Capacitor) and `server/` (Express + Postgres on Neon).

## Commands

### Server (`server/`)

| Command             | Purpose                          |
| ------------------- | -------------------------------- |
| `npm run dev`       | Dev server with hot reload (tsx) |
| `npm run build`     | Compile TypeScript to `dist/`    |
| `npm start`         | Run compiled server              |
| `npm run typecheck` | Type-check without emitting      |

### Client (`client/`)

| Command             | Purpose                          |
| ------------------- | -------------------------------- |
| `npm run dev`       | Vite dev server (port 5173)      |
| `npm run build`     | Type-check + production build    |
| `npm run typecheck` | Type-check without emitting      |

Notes:
- `npm run lint` exists in both packages but ESLint is neither installed nor configured (no config file, no eslint dep) — it will fail. Use `typecheck` as the real static check.
- Android: `npm run android:emulator` builds and runs on emulator-5554; `cap:sync` after changing `capacitor.config.ts` or web assets.

## Testing

- No test framework (no Jest/Vitest). API tests are ad-hoc Node scripts in `server/` root that expect the API running locally: `node test-crud.js`, `test-stock.js`, `test-sales.js`, `test-sales-history.js`, `test-dashboard.js`, `test-reports.js`. Override target with `BASE` env var.
- Rate limiting (10 req/15min on `/api/auth/*`, 100 req/15min elsewhere) will interfere with repeated script runs — restart the server or use a fresh IP window.

## Architecture

- **Server entry**: `server/src/server.ts` → `server/src/app.ts` → `server/src/routes/`
- **Routes**: `server/src/routes/index.ts` mounts `/api/health`, `/api/auth`, `/api/categories`, `/api/products`, `/api/sales`, plus standalone `GET /api/dashboard` and `GET /api/reports/summary` (both auth-protected).
- **Config**: `server/src/config/index.ts` uses Zod — invalid env crashes at startup; `JWT_SECRET` is required.
- **Client entry**: `client/src/main.tsx` → `client/src/App.tsx` (IonReactRouter + IonRouterOutlet + AuthProvider). Unknown paths redirect: authenticated → `/dashboard`, else `/`.
- **Auth state**: `client/src/context/AuthContext.tsx` (`useAuth`); token persisted via `client/src/services/auth.ts`. Protected pages use `components/ProtectedRoute.tsx`.
- **API proxy**: Vite proxies `/api` → `http://localhost:3600` in dev; no client env needed unless overriding (Android emulator: `VITE_API_URL=http://10.0.2.2:3600/api`, see `client/.env.example`).
- **react-router-dom**: v5 (required by `@ionic/react-router` v8 — do NOT upgrade to v6). Use `useHistory`, `Redirect`, `render={...}` on `Route`.
- **Capacitor**: `client/capacitor.config.ts` uses `androidScheme: 'http'` + cleartext only when `CAPACITOR_ANDROID_DEBUG=true`; otherwise HTTPS (cleartext HTTP APIs will be blocked on device).
- **Theme/styles**: `client/src/theme/variables.css` (Ionic CSS vars), `client/src/theme/global.css` (imported in main.tsx), `client/src/styles/components.css` (all component styles — add new component styles here, not inline frameworks).

## Pages

| Route            | Page          | Description                  |
| ---------------- | ------------- | ---------------------------- |
| `/`              | Welcome       | Landing (public)             |
| `/login`         | Login         | Sign in (public)             |
| `/register`      | Register      | Create account (public)      |
| `/dashboard`     | Dashboard     | Business overview + stats    |
| `/products`      | Products      | Inventory list               |
| `/low-stock`     | LowStock      | Low-stock items              |
| `/sales`         | Sales         | New sale / POS checkout      |
| `/sales/history` | SalesHistory  | Transaction history          |
| `/reports`       | Reports       | Business analytics           |
| `/profile`       | Profile       | Account information          |
| `/settings`      | Settings      | App preferences              |

## Reusable Components

Components live in `client/src/components/` (barrel `index.ts`): `PageHeader`, `StatCard`, `EmptyState`, `LoadingState`, `ErrorState`, `Button`, `ProductCard`, `TabBar`, `ProtectedRoute`, `AdjustStockModal`. New shared components should be exported from `index.ts`.

## Database

- **Engine**: PostgreSQL on Neon (serverless), via `pg` Pool. URL from `DATABASE_URL` (currently in `server/.env`; pulled into root `.env.local` by `neon link`/`neon deploy`).
- **Schema**: `initializeSchema()` (now async) in `server/src/services/database.ts`; types in `server/src/types/database.ts`.
- **Query helpers** in `database.ts` are async: `query`, `queryOne`, `run`, `withTransaction` (AsyncLocalStorage-scoped client), `closeDb`, `testConnection`, `initializeSchema`. SQLite-style `?` placeholders are auto-converted to `$n` — keep using `?` in controller SQL. CamelCase SQL aliases must be double-quoted (`AS "userId"`) or Postgres lowercases them.
- **Controllers/routes are async** — route handlers are wrapped with `asyncHandler(...)` from `middleware/errorHandler.ts`; don't register raw async handlers.
- **Tables**: `users`, `categories`, `products`, `sales`, `sale_items`, `stock_adjustments` (product stock changes with reason/previous/new quantity).
- **Sales**: totals computed server-side, stock decrement + sale items in one transaction; deleting a product referenced by a sale → 409.
- **Neon tooling**: `neon.ts` at repo root (branch policy + `auth: true` + public-read `marketlistimages` bucket); linked via `.neon`; branch-first flow with `neon checkout <branch>`. After changing `neon.ts`, run `neon deploy`.

## Authentication

- JWT (HS256), bcryptjs (12 rounds), `Authorization: Bearer <token>`, default expiry `7d` (`JWT_EXPIRES_IN`).
- Middleware: `server/src/middleware/auth.ts` (`authenticateToken`), attaches `AuthRequest.user`. Per-user data isolation: other users' records return 404.
- Endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`.

## Environment

- Server: `server/.env` (copy `.env.example`). `JWT_SECRET` required or server won't start.
- Client: `client/.env` optional; `VITE_API_URL` defaults to proxied `/api`.

## Conventions

- All secrets via env vars — never hardcode.
- Zod for validation, TypeScript strict mode on both packages.
- Ionic UI components for all UI (no custom CSS frameworks).
