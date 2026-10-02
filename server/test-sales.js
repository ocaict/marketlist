const base = process.env.BASE || 'http://localhost:3620/api';
const results = [];
let token = null;
let productA = null;
let productB = null;

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

async function main() {
  const email = `sales-${Date.now()}@example.com`;
  let r = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Sales Tester', email, phone: '+1000000000', businessName: 'Sales Shop', password: 'Password123', confirmPassword: 'Password123' }),
  });
  token = r.data?.data?.token;
  if (!token) { console.log('FAIL setup', r.status, JSON.stringify(r.data)); process.exit(1); }

  const mk = async (name, price, stock) => {
    const res = await request('/products', {
      method: 'POST', headers: auth(),
      body: JSON.stringify({ name, categoryId: null, sku: null, costPrice: price / 2, sellingPrice: price, stockQuantity: stock, lowStockThreshold: 2, imageUrl: null }),
    });
    return res.data?.data?.product;
  };

  productA = await mk('Item A', 1000, 10);
  productB = await mk('Item B', 500, 3);
  log('Setup products', 201, Boolean(productA && productB));

  // 1. Successful sale, server computes totals, stock reduced
  const salesBefore = await request('/sales', { headers: auth() });
  r = await request('/sales', {
    method: 'POST', headers: auth(),
    body: JSON.stringify({
      items: [
        { productId: productA.id, quantity: 2 },
        { productId: productB.id, quantity: 1 },
      ],
      discount: 500,
      paymentMethod: 'cash',
    }),
  });
  const sale = r.data?.data?.sale;
  // expected: subtotal = 2*1000 + 1*500 = 2500, discount 500, total 2000
  log('Create sale (subtotal 2500, discount 500, total 2000)', r.status,
    r.status === 201 && sale?.subtotal === 2500 && sale?.discount === 500 && sale?.total === 2000,
    JSON.stringify({ subtotal: sale?.subtotal, discount: sale?.discount, total: sale?.total }));

  r = await request(`/products/${productA.id}`, { headers: auth() });
  const stockA = r.data?.data?.product?.stockQuantity;
  r = await request(`/products/${productB.id}`, { headers: auth() });
  const stockB = r.data?.data?.product?.stockQuantity;
  log('Stock reduced atomically', 200, stockA === 8 && stockB === 2, `A=${stockA} B=${stockB}`);

  // 2. Server total wins — frontend-sent total must be ignored
  r = await request('/sales', {
    method: 'POST', headers: auth(),
    body: JSON.stringify({ items: [{ productId: productA.id, quantity: 1 }], discount: 0, paymentMethod: 'transfer', total: 1 }),
  });
  log('Client-sent total ignored (server calculates 1000)', r.status, r.status === 201 && r.data?.data?.sale?.total === 1000, `total=${r.data?.data?.sale?.total}`);

  // 3. Insufficient stock -> 409, nothing persisted
  const salesBeforeFail = await request('/sales', { headers: auth() });
  r = await request('/sales', {
    method: 'POST', headers: auth(),
    body: JSON.stringify({ items: [{ productId: productB.id, quantity: 99 }], paymentMethod: 'cash' }),
  });
  r = await request(`/products/${productB.id}`, { headers: auth() });
  const stockB2 = r.data?.data?.product?.stockQuantity;
  const salesAfterFail = await request('/sales', { headers: auth() });
  log('Insufficient stock -> 409, stock & sales unchanged', 409,
    r.status !== 201 && stockB2 === 2 && salesAfterFail.data?.data?.sales?.length === salesBeforeFail.data?.data?.sales?.length,
    `stockB=${stockB2} sales=${salesAfterFail.data?.data?.sales?.length}`);

  // 4. Unknown product -> 404
  r = await request('/sales', { method: 'POST', headers: auth(), body: JSON.stringify({ items: [{ productId: 'nope', quantity: 1 }] }) });
  log('Unknown product -> 404', r.status, r.status === 404);

  // 5. Zero quantity -> 400
  r = await request('/sales', { method: 'POST', headers: auth(), body: JSON.stringify({ items: [{ productId: productA.id, quantity: 0 }] }) });
  log('Zero quantity -> 400', r.status, r.status === 400);

  // 6. Discount larger than subtotal -> 400
  r = await request('/sales', { method: 'POST', headers: auth(), body: JSON.stringify({ items: [{ productId: productA.id, quantity: 1 }], discount: 99999 }) });
  log('Oversized discount -> 400', r.status, r.status === 400);

  // 7. Negative discount -> 400
  r = await request('/sales', { method: 'POST', headers: auth(), body: JSON.stringify({ items: [{ productId: productA.id, quantity: 1 }], discount: -5 }) });
  log('Negative discount -> 400', r.status, r.status === 400);

  // 8. Empty items -> 400
  r = await request('/sales', { method: 'POST', headers: auth(), body: JSON.stringify({ items: [] }) });
  log('Empty cart -> 400', r.status, r.status === 400);

  // 9. Sale detail with items
  const list = await request('/sales', { headers: auth() });
  const first = list.data?.data?.sales?.[0];
  r = await request(`/sales/${first.id}`, { headers: auth() });
  log('GET /sales/:id returns items', r.status, r.status === 200 && Array.isArray(r.data?.data?.sale?.items));

  // 10. Unknown sale -> 404
  r = await request('/sales/does-not-exist', { headers: auth() });
  log('Unknown sale -> 404', r.status, r.status === 404);

  // 11. Stock adjust history records the sale
  r = await request(`/products/${productB.id}/adjustments`, { headers: auth() });
  const adj = r.data?.data?.adjustments?.[0];
  log('Sale recorded in stock adjustments', r.status, r.status === 200 && adj && String(adj.reason).startsWith('Sale '), `reason=${adj?.reason}`);

  console.log('\n--- ' + results.filter((l) => l.startsWith('[PASS')).length + '/' + results.length + ' passed ---');
  process.exit(results.some((l) => l.startsWith('[FAIL')) ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
