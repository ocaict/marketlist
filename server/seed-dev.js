/**
 * Development-only demo data seed.
 *
 * Usage:
 *   cd server
 *   ALLOW_DEV_SEED=true node seed-dev.js
 *
 * This script will REFUSE to run unless ALLOW_DEV_SEED=true is set.
 * Do not run it against a production database. It creates a dedicated
 * demo account (demo@marketlist.dev) and tags all of its data with that
 * user id so it never mixes with real users.
 */
const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
require('dotenv').config();

if (process.env.ALLOW_DEV_SEED !== 'true') {
  console.error('Refusing to seed: set ALLOW_DEV_SEED=true to run this development-only script.');
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is not set.');
  process.exit(1);
}

const DEMO_EMAIL = 'demo@marketlist.dev';

const categories = ['Food', 'Drinks', 'Household', 'Electronics', 'Personal Care'];

const products = [
  { name: 'Indomie', category: 'Food', sku: 'FOOD-001', costPrice: 150, sellingPrice: 250, stock: 3, low: 10 },
  { name: 'Coca-Cola', category: 'Drinks', sku: 'DRK-001', costPrice: 180, sellingPrice: 300, stock: 48, low: 12 },
  { name: 'Bread', category: 'Food', sku: 'FOOD-002', costPrice: 500, sellingPrice: 800, stock: 2, low: 6 },
  { name: 'Peak Milk', category: 'Food', sku: 'FOOD-003', costPrice: 700, sellingPrice: 1000, stock: 30, low: 8 },
  { name: 'Detergent', category: 'Household', sku: 'HSE-001', costPrice: 450, sellingPrice: 650, stock: 25, low: 5 },
  { name: 'Phone Charger', category: 'Electronics', sku: 'ELC-001', costPrice: 1800, sellingPrice: 3000, stock: 1, low: 4 },
];

async function main() {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  // Idempotent: wipe previous demo user data.
  await client.query(
    `DELETE FROM sale_items WHERE sale_id IN (SELECT id FROM sales WHERE user_id IN (SELECT id FROM users WHERE email = $1))`,
    [DEMO_EMAIL]
  );
  await client.query(`DELETE FROM sales WHERE user_id IN (SELECT id FROM users WHERE email = $1)`, [DEMO_EMAIL]);
  await client.query(
    `DELETE FROM stock_adjustments WHERE user_id IN (SELECT id FROM users WHERE email = $1)`,
    [DEMO_EMAIL]
  );
  await client.query(`DELETE FROM products WHERE user_id IN (SELECT id FROM users WHERE email = $1)`, [DEMO_EMAIL]);
  await client.query(`DELETE FROM categories WHERE user_id IN (SELECT id FROM users WHERE email = $1)`, [DEMO_EMAIL]);
  await client.query(`DELETE FROM users WHERE email = $1`, [DEMO_EMAIL]);

  const userId = crypto.randomUUID();
  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash('Demo1234!', 12);
  await client.query(
    `INSERT INTO users (id, name, email, phone, business_name, password_hash, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [userId, 'Demo Owner', DEMO_EMAIL, '08000000000', 'Demo Provision Store', passwordHash, now, now]
  );

  const categoryIds = {};
  for (const name of categories) {
    const id = crypto.randomUUID();
    categoryIds[name] = id;
    await client.query(
      `INSERT INTO categories (id, user_id, name, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)`,
      [id, userId, name, now, now]
    );
  }

  const productIds = {};
  for (const p of products) {
    const id = crypto.randomUUID();
    productIds[p.name] = id;
    await client.query(
      `INSERT INTO products (id, user_id, category_id, name, sku, cost_price, selling_price, stock_quantity, low_stock_threshold, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [id, userId, categoryIds[p.category], p.name, p.sku, p.costPrice, p.sellingPrice, p.stock, p.low, now, now]
    );
  }

  // Realistic sales over the past week (a recent burst for dashboard/report trends).
  const salePlan = [
    { daysAgo: 6, items: [['Indomie', 5], ['Coca-Cola', 2]], method: 'cash' },
    { daysAgo: 5, items: [['Bread', 3], ['Peak Milk', 2]], method: 'transfer' },
    { daysAgo: 4, items: [['Detergent', 1], ['Phone Charger', 1]], method: 'pos' },
    { daysAgo: 3, items: [['Coca-Cola', 6], ['Indomie', 4]], method: 'cash' },
    { daysAgo: 2, items: [['Bread', 2], ['Detergent', 2]], method: 'cash' },
    { daysAgo: 1, items: [['Peak Milk', 3], ['Coca-Cola', 4]], method: 'transfer' },
    { daysAgo: 0, items: [['Indomie', 6], ['Bread', 1], ['Coca-Cola', 3]], method: 'cash' },
  ];

  for (const sale of salePlan) {
    const saleId = crypto.randomUUID();
    const created = new Date(Date.now() - sale.daysAgo * 24 * 3600 * 1000);
    let total = 0;
    for (const [name, qty] of sale.items) {
      const product = products.find((p) => p.name === name);
      total += product.sellingPrice * qty;
    }
    await client.query(
      `INSERT INTO sales (id, user_id, total_amount, payment_method, discount_amount, created_at)
       VALUES ($1, $2, $3, $4, 0, $5)`,
      [saleId, userId, total, sale.method, created.toISOString()]
    );
    for (const [name, qty] of sale.items) {
      const product = products.find((p) => p.name === name);
      await client.query(
        `INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [crypto.randomUUID(), saleId, productIds[name], qty, product.sellingPrice, product.sellingPrice * qty]
      );
    }
  }

  console.log('Demo data seeded.');
  console.log('  Login: demo@marketlist.dev / Demo1234!');
  console.log('  Categories:', categories.join(', '));
  console.log('  Products:', products.map((p) => p.name).join(', '));
  console.log('  Sales:', salePlan.length, 'transactions over the last 7 days');
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
