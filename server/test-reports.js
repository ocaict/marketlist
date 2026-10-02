const base = process.env.BASE || 'http://localhost:3620/api';
const results = [];
let token = null;

function log(name, ok, detail = '') {
  results.push(ok ? 'PASS' : 'FAIL');
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${name} ${detail}`);
}

async function request(path, opts = {}) {
  const { headers, ...rest } = opts;
  const res = await fetch(`${base}${path}`, { headers: { 'Content-Type': 'application/json', ...headers }, ...rest });
  let data;
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, data };
}

const auth = () => ({ Authorization: `Bearer ${token}` });

async function main() {
  const ts = Date.now();
  let r = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Report Tester', email: `rep-${ts}@example.com`, phone: '+1000000000', businessName: 'Report Shop', password: 'Password123', confirmPassword: 'Password123' }),
  });
  token = r.data?.data?.token;
  if (!token) { console.log('FAIL setup'); process.exit(1); }

  const mk = async (name, cost, price, stock) => {
    const res = await request('/products', {
      method: 'POST', headers: auth(),
      body: JSON.stringify({ name, categoryId: null, sku: null, costPrice: cost, sellingPrice: price, stockQuantity: stock, lowStockThreshold: 2, imageUrl: null }),
    });
    return res.data?.data?.product;
  };

  const rice = await mk('Rice 5kg', 1200, 1750, 100);
  const oil = await mk('Palm Oil', 800, 1200, 100);
  const soap = await mk('Soap', 100, 200, 100);

  const sale = async (items, method) =>
    request('/sales', { method: 'POST', headers: auth(), body: JSON.stringify({ items, paymentMethod: method }) });

  // Today: rice x2 (3500), oil x1 (1200) -> 4700, transactions 2
  await sale([{ productId: rice.id, quantity: 2 }], 'cash');
  await sale([{ productId: oil.id, quantity: 1 }], 'transfer');

  // One sale 2 days ago (soap x5 = 1000, profit 5*100=500)
  let r2 = await sale([{ productId: soap.id, quantity: 5 }], 'pos');
  const twoDaysAgoId = r2.data?.data?.sale?.id;

  // One sale 10 days ago (oil x2 = 2400)
  r2 = await sale([{ productId: oil.id, quantity: 2 }], 'cash');
  const tenDaysAgoId = r2.data?.data?.sale?.id;

  const Database = (await import('better-sqlite3')).default;
  const db = new Database(process.env.DB_PATH || 'data/reports-test.db');
  db.prepare('UPDATE sales SET created_at = ? WHERE id = ?').run(new Date(Date.now() - 2 * 86400000).toISOString(), twoDaysAgoId);
  db.prepare('UPDATE sales SET created_at = ? WHERE id = ?').run(new Date(Date.now() - 10 * 86400000).toISOString(), tenDaysAgoId);
  db.close();

  r = await request('/reports/summary?period=today', { headers: auth() });
  let d = r.data?.data;
  log('today totalSales = 4700', r.status === 200 && d?.totalSales === 4700, `value=${d?.totalSales}`);
  log('today transactions = 2', d?.transactionCount === 2, `value=${d?.transactionCount}`);
  log('today profit = 2*550 + 400 = 1500', d?.estimatedGrossProfit === 1500, `value=${d?.estimatedGrossProfit}`);
  log('today trend has 1 point', d?.salesTrend?.length === 1, `len=${d?.salesTrend?.length}`);

  r = await request('/reports/summary?period=last7days', { headers: auth() });
  d = r.data?.data;
  log('last7days totalSales = 5700', r.status === 200 && d?.totalSales === 5700, `value=${d?.totalSales}`);
  log('last7days transactions = 3', d?.transactionCount === 3, `value=${d?.transactionCount}`);
  log('last7days profit = 1500 + 500 = 2000', d?.estimatedGrossProfit === 2000, `value=${d?.estimatedGrossProfit}`);
  log('last7days trend has 7 points', d?.salesTrend?.length === 7, `len=${d?.salesTrend?.length}`);
  log('top product is Soap (5 sold)', d?.topProducts?.[0]?.name === 'Soap' && d?.topProducts?.[0]?.quantitySold === 5, `first=${d?.topProducts?.[0]?.name}`);

  r = await request('/reports/summary?period=month', { headers: auth() });
  d = r.data?.data;
  // Both backdated sales land in the previous month (today is Oct 2, 2026),
  // so this month only contains today's 2 sales totalling 4700.
  log('month totalSales = 4700', r.status === 200 && d?.totalSales === 4700, `value=${d?.totalSales}`);
  log('month transactions = 2', d?.transactionCount === 2, `value=${d?.transactionCount}`);

  r = await request('/reports/summary?period=bogus', { headers: auth() });
  log('invalid period -> 400', r.status === 400);

  console.log(results.filter((x) => x === 'PASS').length + '/' + results.length + ' passed');
  process.exit(results.includes('FAIL') ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
