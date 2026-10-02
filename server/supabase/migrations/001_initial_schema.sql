-- MarketList Database Schema
-- Supabase PostgreSQL Migration
-- Version: 1.0.0

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    business_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on email for fast login lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on user_id for fast per-user lookups
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    cost_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    selling_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER NOT NULL DEFAULT 5,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- ============================================
-- SALES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(50) NOT NULL DEFAULT 'cash',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index on user_id for fast per-user lookups
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);

-- ============================================
-- SALE_ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
    subtotal DECIMAL(10, 2) NOT NULL CHECK (subtotal >= 0)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_product_id ON sale_items(product_id);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES
-- ============================================
-- These policies use auth.uid() which is provided by Supabase Auth.
-- The application must set the JWT claims via set_config('request.jwt.claims', ...)
-- or use Supabase Auth directly.

-- Users table policies
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
    ON users FOR INSERT
    WITH CHECK (id = auth.uid());

-- Categories table policies
CREATE POLICY "Users can view own categories"
    ON categories FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own categories"
    ON categories FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own categories"
    ON categories FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete own categories"
    ON categories FOR DELETE
    USING (user_id = auth.uid());

-- Products table policies
CREATE POLICY "Users can view own products"
    ON products FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own products"
    ON products FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own products"
    ON products FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete own products"
    ON products FOR DELETE
    USING (user_id = auth.uid());

-- Sales table policies
CREATE POLICY "Users can view own sales"
    ON sales FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own sales"
    ON sales FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Sale items table policies
CREATE POLICY "Users can view own sale items"
    ON sale_items FOR SELECT
    USING (sale_id IN (SELECT id FROM sales WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own sale items"
    ON sale_items FOR INSERT
    WITH CHECK (sale_id IN (SELECT id FROM sales WHERE user_id = auth.uid()));
