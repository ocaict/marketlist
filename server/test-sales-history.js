const base = process.env.BASE || 'http://localhost:3620/api';
const results = [];
let token = null;
let tokenB = null;
let productA = null;

function log(name, status, ok, detail = '') {
  const mark = ok ? 'PASS' : 'FAIL';
  const line = `[${mark}] ${name} -> ${status} ${detail}`;
  results.push(line);
  console.log(line);
}

async function request(path, opts = {}) {
  const { headers, ...rest } = opts;
  const res = await fetch(`${base}${path}`, {
    headers: { 'Content-Type': 'application/json', ...headers },
    ...rest,
  });
  let data;
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, data };
}

const auth = () => ({ Authorization: `Bearer ${token}` });
const authB = () => ({ Authorization: `Bearer ${tokenB}` });

async function main() {
  const ts = Date.now();
  let r = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Hist Tester', email: `hist-${ts}@example.com`, phone: '+1000000000', businessName: 'Hist Shop', password: 'Password123', confirmPassword: 'Password123' }),
  });
  token = r.data?.data?.token;
  r = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Other Tester', email: `other-${ts}@example.com`, phone: '+1000000000', businessName: 'Other Shop', password: 'Password123', confirmPassword: 'Password123' }),
  });
  tokenB = r.data?.data?.token;
  if (!token || !tokenB) { console.log('FAIL setup'); process.exit(1); }

  r = await request('/products', {
    method: 'POST', headers: auth(),
    body: JSON.stringify({ name: 'Hist Item', categoryId: null, sku: null, costPrice: 5, sellingPrice: 100, stockQuantity: 50, lowStockThreshold: 2, imageUrl: null }),
  });
  productA = r.data?.data?.product;

  // Make 2 real sales today
  await request('/sales', { method: 'POST', headers: auth(), body: JSON.stringify({ items: [{ productId: productA.id, quantity: 2 }], paymentMethod: 'cash' }) });
  await request('/sales', { method: 'POST', headers: auth(), body: JSON.stringify({ items: [{ productId: productA.id, quantity: 1 }, { productId: productA.id, quantity: 1 }], paymentMethod: 'transfer' }) });

  // Backdate one sale to 3 days ago directly in DB via a raw third sale is not possible;
  // instead insert via API then rewrite created_at using a helper: use the sales-test db? Simplest:
  // create the sale, then use better-sqlite3 to adjust one row.
  r = await request('/sales', { method: 'POST', headers: auth(), body: JSON.stringify({ items: [{ productId: productA.id, quantity: 1 }], paymentMethod: 'pos' }) });
  const oldSaleId = r.data?.data?.sale?.id;

  // Patch created_at of oldSaleId to 3 days ago (test-only direct DB edit)
  const Database = (await import('better-sqlite3')).default;
  const dbPath = process.env.DB_PATH || 'data/sales-history-test.db';
  const db = new Database(dbPath);
  const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
  db.prepare('UPDATE sales SET created_at = ? WHERE id = ?').run(threeDaysAgo, oldSaleId);
  db.close();

  // 1. All sales for user A = 3
  r = await request('/sales', { headers: auth() });
  log('GET /sales (no range) returns all 3', r.status, r.status === 200 && r.data?.data?.sales?.length === 3, `count=${r.data?.data?.sales?.length}`);

  // 2. itemCount present
  const counts = r.data?.data?.sales?.map((s) => s.itemCount);
  log('itemCount included', 200, counts?.every((c) => c >= 1), `counts=${JSON.stringify(counts)}`);

  // 3. today -> 2 (the 3-day-old one excluded)
  r = await request('/sales?range=today', { headers: auth() });
  log('range=today returns 2', r.status, r.status === 200 && r.data?.data?.sales?.length === 2, `count=${r.data?.data?.sales?.length}`);

  // 4. last7days -> 3
  r = await request('/sales?range=last7days', { headers: auth() });
  log('range=last7days returns 3', r.status, r.status === 200 && r.data?.data?.sales?.length === 3, `count=${r.data?.data?.sales?.length}`);

  // 5. yesterday -> 0
  r = await request('/sales?range=yesterday', { headers: auth() });
  log('range=yesterday returns 0', r.status, r.status === 200 && r.data?.data?.sales?.length === 0, `count=${r.data?.data?.sales?.length}`);

  // 6. month -> 3 (same month)
  r = await request('/sales?range=month', { headers: auth() });
  const sameMonth = new Date(threeDaysAgo).getMonth() === new Date().getMonth();
  log('range=month returns expected', r.status, r.status === 200 && r.data?.data?.sales?.length === (sameMonth ? 3 : 2), `count=${r.data?.data?.sales?.length}`);

  // 7. invalid range -> 400
  r = await request('/sales?range=bogus', { headers: auth() });
  log('invalid range -> 400', r.status, r.status === 400);

  // 8. isolation: user B sees none of A's sales
  r = await request('/sales', { headers: authB() });
  log('user B sees 0 sales', r.status, r.status === 200 && r.data?.data?.sales?.length === 0);

  // 9. user B cannot read A's sale
  const listA = await request('/sales', { headers: auth() });
  const firstId = listA.data?.data?.sales?.[0]?.id;
  r = await request(`/sales/${firstId}`, { headers: authB() });
  log('user B gets 404 on A sale', r.status, r.status === 404);

  // 10. sale detail has products/quantity/unit price/subtotal
  r = await request(`/sales/${firstId}`, { headers: auth() });
  const item = r.data?.data?.sale?.items?.[0];
  log('sale detail includes line items', r.status, r.status === 200 && item && item.quantity > 0 && typeof item.unitPrice === 'number' && typeof item.subtotal === 'number');

  console.log('\n--- ' + results.filter((l) => l.startsWith('[PASS')).length + '/' + results.length + ' passed ---');
  process.exit(results.some((l) => l.startsWith('[FAIL')) ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
