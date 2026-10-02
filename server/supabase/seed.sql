-- MarketList Seed Data (Optional)
-- Run this after the initial schema migration to populate test data.
--
-- NOTE: Replace the user UUID with a real user ID from your users table.
-- This seed assumes you have already created a user via the application.

-- Example: Insert categories for a test user
-- INSERT INTO categories (user_id, name)
-- VALUES
--     ('REPLACE_WITH_USER_UUID', 'Beverages'),
--     ('REPLACE_WITH_USER_UUID', 'Snacks'),
--     ('REPLACE_WITH_USER_UUID', 'Household'),
--     ('REPLACE_WITH_USER_UUID', 'Personal Care');

-- Example: Insert products for a test user
-- INSERT INTO products (user_id, category_id, name, sku, cost_price, selling_price, stock_quantity, low_stock_threshold)
-- VALUES
--     ('REPLACE_WITH_USER_UUID', NULL, 'Coca-Cola 500ml', 'CC-500', 1.50, 2.00, 50, 10),
--     ('REPLACE_WITH_USER_UUID', NULL, 'Indomie Noodles', 'IND-001', 1.20, 1.80, 100, 20),
--     ('REPLACE_WITH_USER_UUID', NULL, 'Milo 400g', 'MIL-400', 8.00, 12.00, 30, 5);
