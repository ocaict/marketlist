-- Alternative RLS Policies for Custom JWT Authentication
-- Use this if you are NOT using Supabase Auth and instead using custom JWT.
--
-- With custom JWT, the application must set the user ID before each query:
--   SELECT set_config('app.current_user_id', '<user-uuid>', false);
--
-- Then the policies below will enforce row-level security.

-- ============================================
-- CUSTOM JWT RLS POLICIES (Alternative)
-- ============================================
-- Uncomment these policies and comment out the auth.uid() policies above
-- if using custom JWT instead of Supabase Auth.

-- CREATE POLICY "Users can view own profile (custom JWT)"
--     ON users FOR SELECT
--     USING (id = current_setting('app.current_user_id', true)::uuid);

-- CREATE POLICY "Users can update own profile (custom JWT)"
--     ON users FOR UPDATE
--     USING (id = current_setting('app.current_user_id', true)::uuid);

-- CREATE POLICY "Users can insert own profile (custom JWT)"
--     ON users FOR INSERT
--     WITH CHECK (id = current_setting('app.current_user_id', true)::uuid);

-- CREATE POLICY "Users can view own categories (custom JWT)"
--     ON categories FOR SELECT
--     USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- CREATE POLICY "Users can insert own categories (custom JWT)"
--     ON categories FOR INSERT
--     WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);

-- CREATE POLICY "Users can update own categories (custom JWT)"
--     ON categories FOR UPDATE
--     USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- CREATE POLICY "Users can delete own categories (custom JWT)"
--     ON categories FOR DELETE
--     USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- CREATE POLICY "Users can view own products (custom JWT)"
--     ON products FOR SELECT
--     USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- CREATE POLICY "Users can insert own products (custom JWT)"
--     ON products FOR INSERT
--     WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);

-- CREATE POLICY "Users can update own products (custom JWT)"
--     ON products FOR UPDATE
--     USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- CREATE POLICY "Users can delete own products (custom JWT)"
--     ON products FOR DELETE
--     USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- CREATE POLICY "Users can view own sales (custom JWT)"
--     ON sales FOR SELECT
--     USING (user_id = current_setting('app.current_user_id', true)::uuid);

-- CREATE POLICY "Users can insert own sales (custom JWT)"
--     ON sales FOR INSERT
--     WITH CHECK (user_id = current_setting('app.current_user_id', true)::uuid);

-- CREATE POLICY "Users can view own sale items (custom JWT)"
--     ON sale_items FOR SELECT
--     USING (sale_id IN (SELECT id FROM sales WHERE user_id = current_setting('app.current_user_id', true)::uuid));

-- CREATE POLICY "Users can insert own sale items (custom JWT)"
--     ON sale_items FOR INSERT
--     WITH CHECK (sale_id IN (SELECT id FROM sales WHERE user_id = current_setting('app.current_user_id', true)::uuid));
