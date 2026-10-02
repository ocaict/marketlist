import { writeFileSync } from 'fs';

const base = 'http://localhost:3600/api';
const results = [];
let token = null;
let productId = null;
let categoryId = null;
let otherUserToken = null;

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

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

try {
  // 1. Register user
  {
    const { status, data } = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test User', email: 'test1@example.com', businessName: 'TestBiz', password: 'password123', confirmPassword: 'password123' }),
    });
    const ok = status === 201 && data.data && data.data.token;
    if (ok) token = data.data.token;
    log('Register user', status, ok, data.message || '');
  }

  // 2. Register second user (for isolation test)
  {
    const { status, data } = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Other User', email: 'test2@example.com', businessName: 'OtherBiz', password: 'password123', confirmPassword: 'password123' }),
    });
    const ok = status === 201;
    if (ok) otherUserToken = data.data.token;
    log('Register second user', status, ok, data.message || '');
  }

  // 3. Validation: invalid email
  {
    const { status } = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'X', email: 'not-an-email', businessName: 'Biz', password: 'short', confirmPassword: 'short' }),
    });
    log('Register invalid input rejected', status, status === 400);
  }

  // 4. Create category
  {
    const { status, data } = await request('/categories', {
      method: 'POST',
      headers: auth(token),
      body: JSON.stringify({ name: 'Beverages' }),
    });
    const ok = status === 201 && data.data.category && data.data.category.name === 'Beverages';
    if (ok) categoryId = data.data.category.id;
    log('Create category', status, ok, data.message || '');
  }

  // 5. Validation: duplicate-ish / empty category name
  {
    const { status } = await request('/categories', {
      method: 'POST',
      headers: auth(token),
      body: JSON.stringify({ name: '' }),
    });
    log('Empty category name rejected', status, status === 400);
  }

  // 6. Get categories
  {
    const { status, data } = await request('/categories', { headers: auth(token) });
    const ok = status === 200 && Array.isArray(data.data.categories) && data.data.categories.length >= 1;
    log('Get categories', status, ok);
  }

  // 7. Update category
  {
    const { status, data } = await request(`/categories/${categoryId}`, {
      method: 'PUT',
      headers: auth(token),
      body: JSON.stringify({ name: 'Beverages & Drinks' }),
    });
    const ok = status === 200 && data.data.category.name === 'Beverages & Drinks';
    log('Update category', status, ok);
  }

  // 8. Category not-found
  {
    const { status } = await request('/categories/nonexistent-id', {
      method: 'PUT',
      headers: auth(token),
      body: JSON.stringify({ name: 'X' }),
    });
    log('Update non-existent category -> 404', status, status === 404);
  }

  // 9. Create product (with category)
  {
    const { status, data } = await request('/products', {
      method: 'POST',
      headers: auth(token),
      body: JSON.stringify({
        name: 'Coca Cola',
        categoryId: categoryId,
        sku: 'COKE-001',
        costPrice: 50,
        sellingPrice: 120,
        stockQuantity: 10,
        lowStockThreshold: 5,
        imageUrl: 'https://example.com/coke.jpg',
      }),
    });
    const ok = status === 201 && data.data.product.name === 'Coca Cola';
    if (ok) productId = data.data.product.id;
    log('Create product', status, ok, data.message || '');
  }

  // 10. Validation: negative stock rejected
  {
    const { status, data } = await request('/products', {
      method: 'POST',
      headers: auth(token),
      body: JSON.stringify({
        name: 'Bad Stock Product',
        categoryId: null,
        sku: null,
        costPrice: 10,
        sellingPrice: 20,
        stockQuantity: -5,
        lowStockThreshold: 0,
        imageUrl: null,
      }),
    });
    log('Negative stock rejected', status, status === 400);
  }

  // 11. Validation: negative price rejected
  {
    const { status } = await request('/products', {
      method: 'POST',
      headers: auth(token),
      body: JSON.stringify({
        name: 'Neg Price',
        categoryId: null,
        sku: null,
        costPrice: -10,
        sellingPrice: 20,
        stockQuantity: 0,
        lowStockThreshold: 0,
        imageUrl: null,
      }),
    });
    log('Negative price rejected', status, status === 400);
  }

  // 12. Validation: missing required fields
  {
    const { status } = await request('/products', {
      method: 'POST',
      headers: auth(token),
      body: JSON.stringify({ name: '' }),
    });
    log('Missing fields rejected', status, status === 400);
  }

  // 13. Create low-stock product
  {
    const { status, data } = await request('/products', {
      method: 'POST',
      headers: auth(token),
      body: JSON.stringify({
        name: 'Low Stock Item',
        categoryId: null,
        sku: null,
        costPrice: 5,
        sellingPrice: 15,
        stockQuantity: 2,
        lowStockThreshold: 5,
        imageUrl: null,
      }),
    });
    log('Create low-stock product', status, status === 201);
  }

  // 14. Get products (list)
  {
    const { status, data } = await request('/products', { headers: auth(token) });
    const ok = status === 200 && Array.isArray(data.data.products) && data.data.products.length >= 2;
    log('Get products list', status, ok, `count=${data.data.products.length}`);
  }

  // 15. Get single product
  {
    const { status, data } = await request(`/products/${productId}`, { headers: auth(token) });
    const ok = status === 200 && data.data.product.id === productId;
    log('Get single product', status, ok);
  }

  // 16. Product not-found
  {
    const { status } = await request('/products/nonexistent-id', { headers: auth(token) });
    log('Get non-existent product -> 404', status, status === 404);
  }

  // 17. Update product
  {
    const { status, data } = await request(`/products/${productId}`, {
      method: 'PUT',
      headers: auth(token),
      body: JSON.stringify({
        name: 'Coca Cola Classic',
        categoryId: categoryId,
        sku: 'COKE-001-UPD',
        costPrice: 45,
        sellingPrice: 130,
        stockQuantity: 50,
        lowStockThreshold: 10,
        imageUrl: null,
      }),
    });
    const ok = status === 200 && data.data.product.name === 'Coca Cola Classic' && data.data.product.sku === 'COKE-001-UPD';
    log('Update product', status, ok);
  }

  // 18. Update non-existent product -> 404
  {
    const { status } = await request('/products/nonexistent-id', {
      method: 'PUT',
      headers: auth(token),
      body: JSON.stringify({ name: 'X', categoryId: null, sku: null, costPrice: 1, sellingPrice: 1, stockQuantity: 1, lowStockThreshold: 1, imageUrl: null }),
    });
    log('Update non-existent product -> 404', status, status === 404);
  }

  // 19. Delete product
  {
    const { status } = await request(`/products/${productId}`, {
      method: 'DELETE',
      headers: auth(token),
    });
    log('Delete product', status, status === 204);
  }

  // 20. Verify deleted
  {
    const { status } = await request(`/products/${productId}`, { headers: auth(token) });
    log('Deleted product -> 404', status, status === 404);
  }

  // 21. Delete non-existent product -> 404
  {
    const { status } = await request('/products/nonexistent-id', {
      method: 'DELETE',
      headers: auth(token),
    });
    log('Delete non-existent product -> 404', status, status === 404);
  }

  // 22. Cross-user: other user cannot see user 1's products
  {
    const { status, data } = await request('/products', { headers: auth(otherUserToken) });
    const ok = status === 200 && (data.data.products.length === 0);
    log('Cross-user isolation (other user sees 0 products)', status, ok, `count=${data.data.products.length}`);
  }

  // 23. Cross-user: other user cannot access user 1's product by id
  {
    const { status } = await request(`/products/${productId}`, { headers: auth(otherUserToken) });
    log('Cross-user access to other product -> 404', status, status === 401 || status === 404);
  }

  // 24. Cross-user: other user cannot update user 1's product
  {
    const { status } = await request(`/products/${productId}`, {
      method: 'PUT',
      headers: auth(otherUserToken),
      body: JSON.stringify({ name: 'Hacked', categoryId: null, sku: null, costPrice: 1, sellingPrice: 1, stockQuantity: 1, lowStockThreshold: 1, imageUrl: null }),
    });
    log('Cross-user update rejected', status, status === 401 || status === 404);
  }

  // 25. Cross-user: other user cannot delete user 1's product
  {
    const { status } = await request(`/products/${productId}`, {
      method: 'DELETE',
      headers: auth(otherUserToken),
    });
    log('Cross-user delete rejected', status, status === 401 || status === 404);
  }

  // 26. Unauthenticated access blocked
  {
    const { status } = await request('/products');
    log('Unauthenticated access blocked', status, status === 401);
  }

  // 27. Create product with invalid category (user doesn't own it)
  {
    const { status } = await request('/products', {
      method: 'POST',
      headers: auth(token),
      body: JSON.stringify({
        name: 'Prod', categoryId: 'does-not-exist', sku: null, costPrice: 1, sellingPrice: 2, stockQuantity: 1, lowStockThreshold: 1, imageUrl: null,
      }),
    });
    log('Product with non-owned category rejected', status, status === 400);
  }

  // 28. Create product without category (null) - should succeed
  {
    const { status, data } = await request('/products', {
      method: 'POST',
      headers: auth(token),
      body: JSON.stringify({
        name: 'Uncategorized Product', categoryId: null, sku: null, costPrice: 10, sellingPrice: 20, stockQuantity: 100, lowStockThreshold: 10, imageUrl: null,
      }),
    });
    log('Create product without category', status, status === 201);
  }

  // 29. Delete category that has products (schema uses ON DELETE SET NULL)
  {
    // Create a product that references categoryId first
    await request('/products', {
      method: 'POST',
      headers: auth(token),
      body: JSON.stringify({ name: 'Rel Product', categoryId: categoryId, sku: null, costPrice: 1, sellingPrice: 2, stockQuantity: 1, lowStockThreshold: 1, imageUrl: null }),
    });
    // Delete category - should succeed (204), products referencing it get category_id = NULL
    const { status } = await request(`/categories/${categoryId}`, {
      method: 'DELETE',
      headers: auth(token),
    });
    log('Delete category with products -> 204', status, status === 204);
  }

  // Summary
  const passed = results.filter(r => r.startsWith('[PASS]')).length;
  const failed = results.filter(r => r.startsWith('[FAIL]')).length;
  console.log(`\n=== Summary: ${passed} passed, ${failed} failed ===`);
  writeFileSync('test-results.txt', results.join('\n') + `\n\n=== ${passed} passed, ${failed} failed ===`);
} catch (e) {
  console.error('Test script error:', e);
}
