# MarketList — Inventory & Sales Manager

A mobile-first inventory and sales management application for small businesses such as provision stores, mini supermarkets, boutiques, electronics shops, phone/accessory shops, cosmetics businesses, and similar SMEs.

## Technology Stack

| Layer      | Technology                          |
| ---------- | ----------------------------------- |
| Frontend   | Ionic React, TypeScript, Vite       |
| Routing    | React Router                        |
| UI         | Ionic UI Components, CSS Variables  |
| Backend    | Node.js, Express, TypeScript        |
| Database   | SQLite (local)                      |
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
| `DATABASE_URL` | SQLite database file path            | `./data/marketlist.db` |
| `JWT_SECRET`   | Secret for signing JWT tokens        | —       |
| `JWT_EXPIRES_IN` | JWT token expiration duration      | `7d`    |
| `CORS_ORIGIN`  | Allowed CORS origin                  | `http://localhost:5173` |

### Required Environment Variables

| Variable     | Required | Description                                      |
| ------------ | -------- | ------------------------------------------------ |
| `JWT_SECRET` | Yes      | Secret key for signing JWT tokens. Use a long random string in production. |
| `DATABASE_URL` | No      | SQLite file path. Defaults to `./data/marketlist.db`. |
| `PORT`       | No       | Server port. Defaults to `3600`.                  |
| `NODE_ENV`   | No       | Environment. Defaults to `development`.           |
| `CORS_ORIGIN` | No      | Allowed CORS origin. Defaults to `http://localhost:5173`. |

## Authentication

MarketList uses JWT (JSON Web Token) authentication with bcrypt password hashing.

### How It Works

1. **Registration**: User submits name, email, phone, business name, and password. The server validates input, checks for duplicate emails, hashes the password with bcrypt (12 salt rounds), stores the user in SQLite, and returns a JWT token.

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

MarketList uses **SQLite** for local development. The database file is created automatically at `./data/marketlist.db` when the server starts.

### Schema

The database includes the following tables:

| Table        | Description                              |
| ------------ | ---------------------------------------- |
| `users`      | User accounts (business owners)          |
| `categories` | Product categories (per user)            |
| `products`   | Inventory items (per user)               |
| `sales`      | Sales transactions (per user)            |
| `sale_items` | Line items for each sale                 |

### Future: Supabase PostgreSQL

Migration files for Supabase PostgreSQL are included in `server/supabase/migrations/`. To switch to Supabase in the future:

1. Create a Supabase project at [https://supabase.com](https://supabase.com)
2. Run the migration in the Supabase SQL Editor
3. Update `DATABASE_URL` in `.env` with your Supabase connection string
4. Install `pg` package: `npm install pg @types/pg`
5. Update `server/src/services/database.ts` to use `pg` instead of `better-sqlite3`

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
