const base = process.env.BASE || 'http://localhost:3620/api';
const results = [];
let token = null;
let productA = null;
let productB = null;

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
    body: JSON.stringify({ name: 'Dash Tester', email: `dash-${ts}@example.com`, phone: '+1000000000', businessName: 'Dash Shop', password: 'Password123', confirmPassword: 'Password123' }),
  });
  token = r.data?.data?.token;
  if (!token) { console.log('FAIL setup'); process.exit(1); }

  const mk = async (name, cost, price, stock, threshold) => {
    const res = await request('/products', {
      method: 'POST', headers: auth(),
      body: JSON.stringify({ name, categoryId: null, sku: null, costPrice: cost, sellingPrice: price, stockQuantity: stock, lowStockThreshold: threshold, imageUrl: null }),
    });
    return res.data?.data?.product;
  };

  productA = await mk('Shelf Item', 40, 100, 5, 10); // low stock
  productB = await mk('Counter Item', 200, 500, 50, 5); // fine

  // 2 sales today: A x3, B x1 (subtotal 300+500=800, profit = 3*(100-40)+1*(500-200)=180+300=480)
  await request('/sales', { method: 'POST', headers: auth(), body: JSON.stringify({ items: [{ productId: productA.id, quantity: 3 }], paymentMethod: 'cash' }) });
  await request('/sales', { method: 'POST', headers: auth(), body: JSON.stringify({ items: [{ productId: productB.id, quantity: 1 }], paymentMethod: 'transfer' }) });

  r = await request('/dashboard', { headers: auth() });
  const d = r.data?.data;
  log('Dashboard 200', r.status === 200);
  log('todaysSales = 800', d?.todaysSales === 800, `value=${d?.todaysSales}`);
  log('todaysTransactionCount = 2', d?.todaysTransactionCount === 2, `value=${d?.todaysTransactionCount}`);
  log('totalProducts = 2', d?.totalProducts === 2, `value=${d?.totalProducts}`);
  log('lowStockCount = 1', d?.lowStockCount === 1, `value=${d?.lowStockCount}`);
  log('recentSales length 2', d?.recentSales?.length === 2);
  log('topProducts first is Counter Item (1 sold) vs Shelf x3 -> Shelf first',
    d?.topProducts?.[0]?.name === 'Shelf Item' && d?.topProducts?.[0]?.quantitySold === 3,
    `first=${d?.topProducts?.[0]?.name} qty=${d?.topProducts?.[0]?.quantitySold}`);
  log('estimatedGrossProfit = 480', d?.estimatedGrossProfit === 480, `value=${d?.estimatedGrossProfit}`);

  r = await request('/dashboard?period=bogus', { headers: auth() });
  log('invalid period -> 400', r.status === 400);

  console.log(results.filter((r2) => r2 === 'PASS').length + '/' + results.length + ' passed');
  process.exit(results.includes('FAIL') ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
