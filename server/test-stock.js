const base = process.env.BASE || 'http://localhost:3620/api';
const results = [];
let token = null;
let normalId = null;
let lowId = null;
let zeroId = null;

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
  // Setup: register a fresh user
  const email = `stock-${Date.now()}@example.com`;
  let r = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name: 'Stock Tester', email, phone: '+1000000000', businessName: 'Stock Shop', password: 'Password123', confirmPassword: 'Password123' }),
  });
  token = r.data?.data?.token;
  if (!token) { console.log('FAIL setup', r.status, JSON.stringify(r.data)); process.exit(1); }

  const mk = async (name, stockQuantity, lowStockThreshold) => {
    const res = await request('/products', {
      method: 'POST', headers: auth(),
      body: JSON.stringify({ name, categoryId: null, sku: null, costPrice: 10, sellingPrice: 20, stockQuantity, lowStockThreshold, imageUrl: null }),
    });
    return res;
  };

  // 1. Normal stock (stock > threshold) — should not be low-stock
  r = await mk('Normal Item', 50, 5); normalId = r.data?.data?.product?.id;
  log('Create normal stock product', r.status, r.status === 201, `id=${normalId}`);

  // 2. Low stock (stock <= threshold) — should appear
  r = await mk('Low Item', 3, 5); lowId = r.data?.data?.product?.id;
  log('Create low stock product', r.status, r.status === 201, `id=${lowId}`);

  // 3. Zero stock — should appear
  r = await mk('Zero Item', 0, 5); zeroId = r.data?.data?.product?.id;
  log('Create zero stock product', r.status, r.status === 201, `id=${zeroId}`);

  r = await request('/products/low-stock', { headers: auth() });
  const names = (r.data?.data?.products || []).map((p) => p.name);
  log('GET /products/low-stock returns only low/zero', r.status,
    r.status === 200 && names.includes('Low Item') && names.includes('Zero Item') && !names.includes('Normal Item'),
    `names=${JSON.stringify(names)}`);

  // 4. Normal manual adjustment
  r = await request(`/products/${normalId}/adjust`, { method: 'POST', headers: auth(), body: JSON.stringify({ newQuantity: 42, reason: 'Restock from supplier' }) });
  const adj = r.data?.data?.adjustment;
  log('Adjust normal product to 42', r.status,
    r.status === 200 && r.data?.data?.product?.stockQuantity === 42 && adj?.previousQuantity === 50 && adj?.newQuantity === 42 && adj?.difference === -8 && adj?.reason === 'Restock from supplier',
    JSON.stringify(adj));

  // 5. Invalid quantity (negative) rejected
  r = await request(`/products/${normalId}/adjust`, { method: 'POST', headers: auth(), body: JSON.stringify({ newQuantity: -3, reason: 'Bad' }) });
  log('Negative adjustment rejected', r.status, r.status === 400, r.data?.message);

  // 6. Non-integer rejected
  r = await request(`/products/${normalId}/adjust`, { method: 'POST', headers: auth(), body: JSON.stringify({ newQuantity: 4.5, reason: 'Bad' }) });
  log('Non-integer adjustment rejected', r.status, r.status === 400);

  // 7. Missing reason rejected
  r = await request(`/products/${normalId}/adjust`, { method: 'POST', headers: auth(), body: JSON.stringify({ newQuantity: 10, reason: '   ' }) });
  log('Missing reason rejected', r.status, r.status === 400);

  // 8. Product reaching zero
  r = await request(`/products/${lowId}/adjust`, { method: 'POST', headers: auth(), body: JSON.stringify({ newQuantity: 0, reason: 'Stock count complete' }) });
  log('Adjust low product to zero', r.status, r.status === 200 && r.data?.data?.product?.stockQuantity === 0);

  // 9. Verify zero product now shows in low-stock
  r = await request('/products/low-stock', { headers: auth() });
  const names2 = (r.data?.data?.products || []).map((p) => p.name);
  log('Zero-stock product still in low-stock', r.status, names2.includes('Low Item'), `names=${JSON.stringify(names2)}`);

  // 10. Below-zero attempt (delta encoded as target) rejected: target negative
  r = await request(`/products/${normalId}/adjust`, { method: 'POST', headers: auth(), body: JSON.stringify({ newQuantity: -100, reason: 'Below zero' }) });
  log('Below-zero adjustment rejected', r.status, r.status === 400);

  // 11. Adjustment history recorded
  r = await request(`/products/${normalId}/adjustments`, { headers: auth() });
  const list = r.data?.data?.adjustments || [];
  log('Adjustment history recorded', r.status, r.status === 200 && list.length >= 1 && list[0].difference !== undefined && list[0].reason !== undefined, `count=${list.length}`);

  // 12. Unknown product -> 404
  r = await request(`/products/does-not-exist/adjust`, { method: 'POST', headers: auth(), body: JSON.stringify({ newQuantity: 5, reason: 'x' }) });
  log('Adjust unknown product -> 404', r.status, r.status === 404);

  console.log('\n--- ' + results.filter((l) => l.startsWith('[PASS')).length + '/' + results.length + ' passed ---');
  process.exit(results.some((l) => l.startsWith('[FAIL')) ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
