# MarketList — Inventory & Sales Manager

A mobile-first inventory and sales management application for small businesses such as provision stores, mini supermarkets, boutiques, electronics shops, phone/accessory shops, cosmetics businesses, and similar SMEs.

## Technology Stack

| Layer      | Technology                          |
| ---------- | ----------------------------------- |
| Frontend   | Ionic React, TypeScript, Vite       |
| Routing    | React Router                        |
| UI         | Ionic UI Components, CSS Variables  |
| Backend    | Node.js, Express, TypeScript        |
| Database   | PostgreSQL (Neon)                   |
| Auth       | JWT, bcrypt/bcryptjs                |
| Validation | Zod                                 |
| Mobile     | Capacitor                           |

## Project Structure

```
marketlist/
  client/                 # Ionic React frontend
    src/
      components/         # Reusable UI components
      pages/              # Route-level page components
      services/           # API service layer
      theme/              # CSS variables & global styles
      styles/             # Component styles
      App.tsx             # Root component with router
      main.tsx            # Entry point
    capacitor.config.ts   # Capacitor configuration
    vite.config.ts        # Vite configuration
    package.json
  server/                 # Express backend
    src/
      config/             # Environment & app configuration
      controllers/        # Request handlers
      middleware/         # Express middleware
      routes/             # Route definitions
      services/           # Business logic layer
      types/              # TypeScript interfaces
      utils/              # Utility functions
      app.ts              # Express app setup
      server.ts           # Server entry point
    supabase/             # Supabase migration files (for future use)
    package.json
  README.md
  .gitignore
```

## Prerequisites

- [Node.js](https://nodejs.org/) v18+ (LTS recommended)
- npm v9+

### For Android builds

- [Android Studio](https://developer.android.com/studio) (includes the Android SDK and an emulator manager)
- JDK 17 (bundled with Android Studio as "jbr" — set `JAVA_HOME` to it, e.g. `C:\Program Files\Android\Android Studio\jbr`)
- Android SDK Platform 34 + Build-Tools (install via Android Studio → SDK Manager; the Gradle build will also tell you what it needs)
- A physical device with USB debugging enabled, **or** an AVD emulator created in Android Studio
- On Windows, ensure `java`, `adb`, and `platform-tools` are on your PATH (or call them via Android Studio's bundled paths)

## Mobile (Capacitor + Android)

The Android project lives in `client/android/`. Capacitor config: `client/capacitor.config.ts`
(appId `com.marketlist.app`, app name `MarketList`, `webDir: dist`, HTTPS scheme by default).

### First-time setup

```bash
cd client
npm install
npx cap add android     # already done — safe to skip
```

### Every code change

```bash
cd client
npm run build           # rebuilds dist/
npx cap sync android    # copies web assets + updates plugins
```

### Run on an emulator or device

```bash
cd client
npx cap run android                      # picks a connected device/emulator
npx cap run android --target emulator-5554
npm run android:emulator                 # build + sync + run in one step
```

### Open in Android Studio

```bash
cd client
npx cap open android
```

### Point the app at your API

Set `VITE_API_URL` in `client/.env` **before** `npm run build`:

- Cloud backend (production): `https://marketlist-api-g8ms.onrender.com/api`
- Local server on emulator: `http://10.0.2.2:3600/api` (plus `CAPACITOR_ANDROID_DEBUG=true npx cap sync android` for cleartext HTTP)
- Local server on physical device (same Wi-Fi): `http://<your-pc-ip>:3600/api` (also needs the debug cleartext flag)

### Branding

App icon and splash resources are in `client/android/app/src/main/res/` (`mipmap-*`, `drawable*`).
Replace those assets, then re-run `npx cap sync android` and rebuild.

### Build a standalone APK (no Android Studio needed)

```bash
cd client/android
./gradlew assembleDebug    # debug APK at app/build/outputs/apk/debug/app-debug.apk
```

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd marketlist
```

### 2. Install backend dependencies

```bash
cd server
npm install
```

### 3. Install frontend dependencies

```bash
cd ../client
npm install
```

## Configuration

### Backend

Copy the example environment file and fill in your values:

```bash
cd server
cp .env.example .env
```

| Variable       | Description                          | Default |
| -------------- | ------------------------------------ | ------- |
| `PORT`         | Port the API server listens on       | `3600`  |
| `NODE_ENV`     | Environment (`development`/`production`) | `development` |
| `DATABASE_URL` | PostgreSQL connection string          | — |
| `JWT_SECRET`   | Secret for signing JWT tokens        | —       |
| `JWT_EXPIRES_IN` | JWT token expiration duration      | `7d`    |
| `CORS_ORIGIN`  | Allowed CORS origin                  | `http://localhost:5173` |

### Required Environment Variables

| Variable     | Required | Description                                      |
| ------------ | -------- | ------------------------------------------------ |
| `JWT_SECRET` | Yes | Long random string, at least 32 characters — the server refuses to boot with a shorter one. |
| `DATABASE_URL` | Yes     | PostgreSQL connection string (Neon). |
| `PORT`       | No       | Server port. Defaults to `3600`.                  |
| `NODE_ENV`   | No       | Environment. Defaults to `development`.           |
| `CORS_ORIGIN` | No      | Allowed CORS origin. Defaults to `http://localhost:5173`. |

## Authentication

MarketList uses JWT (JSON Web Token) authentication with bcrypt password hashing.

### How It Works

1. **Registration**: User submits name, email, phone, business name, and password. The server validates input, checks for duplicate emails, hashes the password with bcrypt (12 salt rounds), stores the user in PostgreSQL, and returns a JWT token.

2. **Login**: User submits email and password. The server normalizes the email, finds the user, verifies the password with bcrypt, and returns a JWT token.

3. **Authenticated Requests**: Client includes the JWT in the `Authorization: Bearer <token>` header. The server verifies the token, loads the user, and attaches it to the request.

4. **Token Expiration**: Tokens expire after the duration specified in `JWT_EXPIRES_IN` (default: 7 days).

### Security Features

- **Password hashing**: bcrypt with 12 salt rounds
- **JWT tokens**: Signed with HS256 algorithm
- **Rate limiting**: 100 requests per 15 minutes per IP (10 for auth endpoints)
- **Helmet**: Security headers (XSS protection, content security policy, etc.)
- **CORS**: Configurable origin whitelist
- **Input validation**: Zod schemas for all inputs
- **No password exposure**: `password_hash` is never returned in API responses

### API Endpoints

#### POST /api/auth/register

Register a new user account.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "businessName": "John's Store",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123"
}
```

**Response (201):**
```json
{
  "status": "success",
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "business_name": "John's Store",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Error Responses:**
- `400` — Validation failed (invalid email, weak password, passwords don't match)
- `409` — Email already registered

#### POST /api/auth/login

Authenticate an existing user.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Error Responses:**
- `400` — Validation failed
- `401` — Invalid email or password

#### GET /api/auth/me

Get the currently authenticated user's profile.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "business_name": "John's Store",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- `401` — Missing or invalid token

#### GET /api/profile

Get the authenticated user's profile (same user object as `/api/auth/me`).

#### PUT /api/profile

Update profile fields. Body (all optional, at least one required):

```json
{ "name": "Jane", "businessName": "Jane's Store", "phone": "08012345678", "email": "jane@example.com" }
```

`phone` may be `null` to clear it. Returns `200` with the updated user, `400` on validation failure, `409` if the email is already used by another account. `password_hash` is never included in responses.

#### Inventory and categories

All inventory and category endpoints require `Authorization: Bearer <token>`. Records are scoped to the authenticated user; a product or category owned by another user is returned as `404`.

| Method | Endpoint | Result |
| ------ | -------- | ------ |
| `GET` | `/api/categories` | List the user's categories |
| `POST` | `/api/categories` | Create a category with `{ "name": "Pantry" }` (`201`) |
| `PUT` | `/api/categories/:id` | Rename a category with `{ "name": "Dry goods" }` |
| `DELETE` | `/api/categories/:id` | Delete a category (`204`); its products become uncategorized |
| `GET` | `/api/products` | List the user's products, including category names |
| `GET` | `/api/products/:id` | Get one product |
| `POST` | `/api/products` | Create a product (`201`) |
| `PUT` | `/api/products/:id` | Replace a product's editable fields |
| `DELETE` | `/api/products/:id` | Delete a product (`204`) |

Product create/update requests use this JSON shape:

```json
{
  "name": "Rice (5kg)",
  "categoryId": "category-uuid",
  "sku": "RICE-05",
  "costPrice": 1200,
  "sellingPrice": 1750,
  "stockQuantity": 12,
  "lowStockThreshold": 5,
  "imageUrl": "https://example.com/rice.jpg"
}
```

`categoryId`, `sku`, and `imageUrl` may be `null` or omitted. Prices must be finite, non-negative numbers; stock and threshold must be non-negative integers. Invalid input returns `400`, missing records return `404`, and deleting a product referenced by a sale returns `409`.

#### Inventory, low stock, and adjustments

| Method | Endpoint | Result |
| ------ | -------- | ------ |
| `GET` | `/api/products/low-stock` | Products with `stockQuantity <= lowStockThreshold` |
| `POST` | `/api/products/:id/adjust` | Set stock to `{ "newQuantity": 12, "reason": "Restock" }`; records previous/new quantity, difference, reason, and date |
| `GET` | `/api/products/:id/adjustments` | Adjustment history for a product |

#### Sales

| Method | Endpoint | Result |
| ------ | -------- | ------ |
| `POST` | `/api/sales` | Complete a sale; server computes totals and atomically creates sale items and decrements stock |
| `GET` | `/api/sales` | Sale history; supports `?range=today\|yesterday\|last7days\|month` |
| `GET` | `/api/sales/:id` | Sale details with line items |

Sale request body:

```json
{
  "items": [{ "productId": "category-uuid", "quantity": 2 }],
  "discount": 0,
  "paymentMethod": "cash"
}
```

`paymentMethod` is one of `cash`, `transfer`, `pos`, `other`. The server always calculates totals; insufficient stock returns `409`, and any failure rolls the whole transaction back.

### API Tests

With the API running locally, the ad-hoc scripts exercise the main flows (each expects the server on its configured port and `BASE` env var to override):

```bash
cd server
node test-crud.js             # categories + products CRUD
node test-stock.js            # low-stock + adjustments
node test-sales.js            # POS sales flow
node test-sales-history.js    # history filtering + isolation
```

### Frontend

The frontend uses Vite's built-in environment support. Create a `.env` file in `client/` if needed:

```bash
VITE_API_URL=/api
```

In dev you can omit it — Vite proxies `/api` to `http://localhost:3600`. For Android emulator builds use `http://10.0.2.2:3600/api` (see `client/.env.example`).

## Architecture

```
client/  Ionic React (React 18, react-router-dom v5, Vite)
          -> services/*: fetch wrappers hitting /api (proxied in dev)
          -> context/AuthContext: JWT persisted in localStorage
          -> Capacitor wraps the built dist/ for native Android
server/  Express (TypeScript) API
          -> middleware: helmet, CORS, rate limits, auth (JWT), errorHandler
          -> routes -> controllers -> services/database (pg Pool, Neon Postgres)
          -> zod validation on config and request bodies
```

- No npm workspaces — `client/` and `server/` have separate `package.json`s.
- Auth is JWT (HS256, bcryptjs 12 rounds). All business routes require `Authorization: Bearer <token>` and are scoped per `user_id` (other users' records return 404).
- Destructive actions in the UI have confirmation dialogs; forms validate client-side and surface server field errors.
- Online-first: an offline banner appears when the device has no connectivity, but no offline sync.

## Development Commands

| Package | Command | Purpose |
| ------- | ------- | ------- |
| server | `npm run dev` | tsx watch dev server on :3600 |
| server | `npm run build` / `npm start` | tsc compile / run dist |
| server | `npm run typecheck` | Type-check only |
| client | `npm run dev` | Vite dev server on :5173 |
| client | `npm run build` / `npm run preview` | tsc + vite build / preview |
| client | `npm run typecheck` | Type-check only |

Note: `npm run lint` exists but ESLint is not installed/configured — `typecheck` is the real static check.

API smoke tests (require the API running locally): `cd server && node test-crud.js` (also `test-stock.js`, `test-sales.js`, `test-sales-history.js`, `test-dashboard.js`, `test-reports.js`).

## Android

Covered in [Mobile (Capacitor + Android)](#mobile-capacitor--android) above. TL;DR:

```bash
cd client
# set VITE_API_URL in client/.env first
npm run build && npx cap sync android
cd android && ./gradlew assembleDebug   # APK in app/build/outputs/apk/debug/
```

## Deployment

- **Backend (Render)**: Web Service, root dir `server/`, build `npm install --include=dev && npm run build` (devDependencies are required for `tsc` because Render sets `NODE_ENV=production`), start `npm start`, health check `/api/health`. Env vars: `NODE_ENV=production`, `JWT_SECRET` (>=32 chars), `DATABASE_URL` (Neon pooled URL), `CORS_ORIGIN` (comma-separated exact origins, e.g. `https://localhost` for the Android WebView).
- **Frontend**: static host for the web build, or the Android APK. Set `VITE_API_URL` before building the APK.
- Free Render tier: the service sleeps after ~15 min idle; first request takes 30–60s.

## Known Limitations

- Online-first: no offline data sync; a banner notifies when offline.
- No automated test framework — API smoke scripts only (`server/test-*.js`).
- `npm run lint` is not functional (ESLint not installed).
- Product photos are stored as data URLs in `products.image_url` (large rows possible); no object storage upload.
- Rate limiting (10/15min on `/api/auth/*`) can trip smoke-test scripts run repeatedly.
- Android camera photos require the `CAMERA`/`READ_MEDIA_IMAGES` permissions granted at runtime; denial falls back to pasting an image URL.

## Running the Application

### Backend (development)

```bash
cd server
npm run dev
```

The API will be available at `http://localhost:3600`.

### Frontend (development)

```bash
cd client
npm run dev
```

The app will be available at `http://localhost:5173`.

### Health Check

```bash
curl http://localhost:3600/api/health
```

Expected response:

```json
{
  "status": "ok",
  "message": "MarketList API is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Database

MarketList uses **PostgreSQL on Neon**. The database schema is created automatically on server start via `initializeSchema()` (idempotent `CREATE TABLE IF NOT EXISTS`). Set `DATABASE_URL` to your Neon connection string (see `server/.env.example`).

### Schema

The database includes the following tables:

| Table        | Description                              |
| ------------ | ---------------------------------------- |
| `users`      | User accounts (business owners)          |
| `categories` | Product categories (per user)            |
| `products`   | Inventory items (per user)               |
| `sales`      | Sales transactions (per user)            |
| `sale_items` | Line items for each sale                 |

### Using Supabase instead of Neon

Migration files for Supabase PostgreSQL are included in `server/supabase/migrations/`. Since the app already uses `pg`, switching is just:

1. Create a Supabase project at [https://supabase.com](https://supabase.com)
2. Run the migration in the Supabase SQL Editor
3. Update `DATABASE_URL` in `.env` with your Supabase connection string

(Note: the Supabase migration enables Row Level Security with `auth.uid()` policies, which require Supabase Auth — for a drop-in replacement, disable RLS or use the app's own schema from `database.ts` instead.)

## Build for Production

### Backend

```bash
cd server
npm run build
npm start
```

### Frontend

```bash
cd client
npm run build
```

The production build will be in `client/dist/`.

## License

MIT
