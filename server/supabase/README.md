# MarketList — Supabase Database Setup

## Overview

MarketList uses Supabase PostgreSQL as its database. This directory contains SQL migrations, seed data, and setup instructions.

## Database Schema

### Tables

| Table        | Description                              |
| ------------ | ---------------------------------------- |
| `users`      | User accounts (business owners)          |
| `categories` | Product categories (per user)            |
| `products`   | Inventory items (per user)               |
| `sales`      | Sales transactions (per user)            |
| `sale_items` | Line items for each sale                 |

### Entity Relationship

```
users (1) ───< (N) categories
  │
  ├──< (N) products >── (N) categories
  │
  └──< (N) sales ───< (N) sale_items >── (N) products
```

### Primary Keys

All tables use UUID primary keys (`uuid_generate_v4()`).

### Foreign Keys

| Table        | Column       | References    | On Delete    |
| ------------ | ------------ | ------------- | ------------ |
| `categories` | `user_id`    | `users.id`    | CASCADE      |
| `products`   | `user_id`    | `users.id`    | CASCADE      |
| `products`   | `category_id`| `categories.id`| SET NULL    |
| `sales`      | `user_id`    | `users.id`    | CASCADE      |
| `sale_items` | `sale_id`    | `sales.id`    | CASCADE      |
| `sale_items` | `product_id` | `products.id` | RESTRICT     |

### Indexes

| Table        | Index Column  | Purpose                          |
| ------------ | ------------- | -------------------------------- |
| `users`      | `email`       | Fast login lookups               |
| `categories` | `user_id`     | Fast per-user category queries   |
| `products`   | `user_id`     | Fast per-user product queries    |
| `products`   | `category_id` | Filter products by category      |
| `products`   | `name`        | Product name search              |
| `sales`      | `user_id`     | Fast per-user sales queries      |
| `sales`      | `created_at`  | Date-range sales reports         |
| `sale_items` | `sale_id`     | Fast sale detail lookups         |
| `sale_items` | `product_id`  | Product sales history            |

## Row Level Security (RLS)

All tables have RLS enabled. Users can only access their own data.

### How It Works

The RLS policies use `auth.uid()` which is provided by Supabase Auth. When a user authenticates, Supabase sets the `auth.uid()` function to return the authenticated user's UUID.

### Policy Summary

| Table        | SELECT | INSERT | UPDATE | DELETE |
| ------------ | ------ | ------ | ------ | ------ |
| `users`      | Own    | Own    | Own    | —      |
| `categories` | Own    | Own    | Own    | Own    |
| `products`   | Own    | Own    | Own    | Own    |
| `sales`      | Own    | Own    | —      | —      |
| `sale_items` | Own*   | Own*   | —      | —      |

\* Sale items are accessible if the parent sale belongs to the user.

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click **New Project**
4. Choose a name (e.g., `marketlist`)
5. Set a database password (save this securely)
6. Choose a region closest to your users
7. Click **Create new project**

### 2. Get Your Connection String

1. In your Supabase project, go to **Project Settings** (gear icon)
2. Click **Database**
3. Under **Connection string**, copy the **URI** format
4. It looks like: `postgresql://postgres:password@db.XXXX.supabase.co:5432/postgres`

### 3. Run the Migration

#### Option A: Supabase SQL Editor (Recommended)

1. In your Supabase project, go to **SQL Editor**
2. Click **New query**
3. Open `server/supabase/migrations/001_initial_schema.sql`
4. Copy the entire contents and paste into the SQL editor
5. Click **Run**

#### Option B: psql Command Line

```bash
psql "postgresql://postgres:password@db.XXXX.supabase.co:5432/postgres" \
  -f server/supabase/migrations/001_initial_schema.sql
```

### 4. Configure Environment Variables

```bash
cd server
cp .env.example .env
```

Edit `.env` and set:

```
DATABASE_URL=postgresql://postgres:password@db.XXXX.supabase.co:5432/postgres
JWT_SECRET=your-super-secret-key
```

### 5. Verify the Setup

```bash
cd server
npm run dev
```

Then test the health endpoint:

```bash
curl http://localhost:3001/api/health
```

## Custom JWT vs Supabase Auth

The schema includes two RLS policy options:

1. **Supabase Auth** (default in `001_initial_schema.sql`) — uses `auth.uid()`
2. **Custom JWT** (in `002_rls_custom_jwt.sql`) — uses `current_setting('app.current_user_id')`

If you're using custom JWT (not Supabase Auth), uncomment the policies in `002_rls_custom_jwt.sql` and comment out the `auth.uid()` policies in `001_initial_schema.sql`.

With custom JWT, your application must set the user ID before each query:

```sql
SELECT set_config('app.current_user_id', '<user-uuid>', false);
```

## Seed Data (Optional)

To populate test data:

```bash
psql "postgresql://postgres:password@db.XXXX.supabase.co:5432/postgres" \
  -f server/supabase/seed.sql
```

**Note:** Replace `REPLACE_WITH_USER_UUID` in the seed file with a real user ID from your `users` table.

## Troubleshooting

### "relation does not exist" errors
- Make sure you ran the migration in the correct database
- Check that the migration ran without errors

### "permission denied" errors
- Verify RLS is enabled: `SELECT * FROM pg_tables WHERE tablename = 'users';`
- Check policies exist: `SELECT * FROM pg_policies WHERE tablename = 'users';`

### Connection timeout
- Verify your connection string is correct
- Check that your Supabase project is running
- Ensure your IP is allowlisted in Supabase (if using IP restrictions)
