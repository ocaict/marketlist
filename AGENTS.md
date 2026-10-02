# AGENTS.md

## Project Overview

MarketList is a mobile-first inventory and sales management app for small businesses. Monorepo with two packages: `client/` (Ionic React) and `server/` (Express).

## Commands

### Server (`server/`)

| Command         | Purpose                          |
| --------------- | -------------------------------- |
| `npm run dev`   | Start dev server with hot reload |
| `npm run build` | Compile TypeScript to `dist/`    |
| `npm start`     | Run compiled server              |
| `npm run typecheck` | Type-check without emitting  |

### Client (`client/`)

| Command         | Purpose                          |
| --------------- | -------------------------------- |
| `npm run dev`   | Start Vite dev server (port 5173) |
| `npm run build` | Type-check + production build    |
| `npm run preview` | Preview production build       |
| `npm run typecheck` | Type-check without emitting  |

## Architecture

- **Server entry**: `server/src/server.ts` → `server/src/app.ts` → `server/src/routes/`
- **Config**: `server/src/config/index.ts` uses Zod to validate env vars at startup — invalid config crashes immediately
- **Client entry**: `client/src/main.tsx` → `client/src/App.tsx` (IonReactRouter + IonRouterOutlet)
- **API proxy**: Vite proxies `/api` → `http://localhost:3600` in dev mode
- **react-router-dom**: v5 (required by `@ionic/react-router` v8 — do NOT upgrade to v6)
- **Theme**: `client/src/theme/variables.css` — centralized Ionic CSS variables for brand colors
- **Global styles**: `client/src/theme/global.css` — imports Ionic core + theme + utility classes
- **Component styles**: `client/src/styles/components.css` — all component-specific styles

## Pages

| Route         | Page       | Description                    |
| ------------- | ---------- | ------------------------------ |
| `/`           | Welcome    | Landing page with app features |
| `/login`      | Login      | Sign in form                   |
| `/register`   | Register   | Create account form            |
| `/dashboard`  | Dashboard  | Business overview + stats      |
| `/products`   | Products   | Inventory list                 |
| `/sales`      | Sales      | Transaction history            |
| `/reports`    | Reports    | Business analytics             |
| `/profile`    | Profile    | Account information            |
| `/settings`   | Settings   | App preferences                |

## Reusable Components

| Component     | File                              | Purpose                    |
| ------------- | --------------------------------- | -------------------------- |
| `PageHeader`  | `components/PageHeader.tsx`        | Page title + back button   |
| `StatCard`    | `components/StatCard.tsx`          | Dashboard stat display     |
| `EmptyState`  | `components/EmptyState.tsx`        | Empty list placeholder     |
| `LoadingState`| `components/LoadingState.tsx`      | Loading spinner            |
| `ErrorState`  | `components/ErrorState.tsx`        | Error display + retry       |
| `Button`      | `components/Button.tsx`            | Styled IonButton wrapper   |
| `ProductCard` | `components/ProductCard.tsx`       | Product list item          |
| `TabBar`      | `components/TabBar.tsx`            | Bottom tab navigation      |

## Database

- **Engine**: SQLite (local file-based)
- **File**: `./data/marketlist.db` (created automatically on server start)
- **Schema**: Initialized in `server/src/services/database.ts` via `initializeSchema()`
- **Types**: `server/src/types/database.ts` — TypeScript interfaces for all tables
- **Migrations**: `server/supabase/migrations/` — Supabase PostgreSQL files for future use

### Schema Overview

| Table        | PK (TEXT/FK) | Indexes |
| ------------ | ------------ | ------- |
| `users`      | `id`         | `email` |
| `categories` | `id`, `user_id` → `users.id` | `user_id` |
| `products`   | `id`, `user_id` → `users.id`, `category_id` → `categories.id` | `user_id`, `category_id`, `name` |
| `sales`      | `id`, `user_id` → `users.id` | `user_id`, `created_at` |
| `sale_items` | `id`, `sale_id` → `sales.id`, `product_id` → `products.id` | `sale_id`, `product_id` |

### Future: Supabase PostgreSQL

Migration files for Supabase are in `server/supabase/migrations/`. To switch:
1. Create Supabase project at [supabase.com](https://supabase.com)
2. Run `001_initial_schema.sql` in Supabase SQL Editor
3. Update `DATABASE_URL` in `.env` with Supabase connection string
4. Install `pg`: `npm install pg @types/pg`
5. Rewrite `server/src/services/database.ts` to use `pg` instead of `better-sqlite3`

## Authentication

- **Type**: JWT (HS256) with bcrypt password hashing (12 salt rounds)
- **Token expiration**: Configurable via `JWT_EXPIRES_IN` (default: `7d`)
- **Auth middleware**: `server/src/middleware/auth.ts` — `authenticateToken`
- **Protected routes**: Add `authenticateToken` middleware to route definitions
- **Request extension**: `AuthRequest` interface adds `user?: User` to Express Request
- **Rate limiting**: 10 auth requests per 15 minutes per IP
- **Security**: Helmet headers, CORS, Zod validation on all inputs

### Auth Endpoints

| Method | Path              | Description              | Auth Required |
| ------ | ----------------- | ------------------------ | ------------- |
| POST   | `/api/auth/register` | Create new account    | No            |
| POST   | `/api/auth/login`    | Sign in               | No            |
| GET    | `/api/auth/me`       | Get current user      | Yes           |

## Environment

- Server: `server/.env` (copy from `.env.example`). `JWT_SECRET` is required — server won't start without it.
- Client: `client/.env` (copy from `.env.example`). `VITE_API_URL` defaults to `/api` (proxied).

## Conventions

- All secrets via env vars — never hardcode
- Zod for validation, TypeScript strict mode
- Ionic UI components for all UI (no custom CSS frameworks)
- Capacitor for mobile builds (Android/iOS)
