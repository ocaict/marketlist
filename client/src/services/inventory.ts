import { apiRequest } from './api';
import { Category, Product } from '../types';

interface ProductPayload {
  name: string;
  categoryId: string | null;
  sku: string | null;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  imageUrl: string | null;
}

function authHeaders(token: string, json = false): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
  };
}

export async function fetchProducts(token: string): Promise<Product[]> {
  const response = await apiRequest<{ data: { products: Product[] } }>('/products', {
    headers: authHeaders(token),
  });
  return response.data.products;
}

export async function fetchCategories(token: string): Promise<Category[]> {
  const response = await apiRequest<{ data: { categories: Category[] } }>('/categories', {
    headers: authHeaders(token),
  });
  return response.data.categories;
}

export async function createProduct(token: string, payload: ProductPayload): Promise<Product> {
  const response = await apiRequest<{ data: { product: Product } }>('/products', {
    method: 'POST',
    headers: authHeaders(token, true),
    body: JSON.stringify(payload),
  });
  return response.data.product;
}

export async function updateProduct(
  token: string,
  id: string,
  payload: ProductPayload
): Promise<Product> {
  const response = await apiRequest<{ data: { product: Product } }>(
    `/products/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      headers: authHeaders(token, true),
      body: JSON.stringify(payload),
    }
  );
  return response.data.product;
}

export async function fetchLowStockProducts(token: string): Promise<Product[]> {
  const response = await apiRequest<{ data: { products: Product[] } }>('/products/low-stock', {
    headers: authHeaders(token),
  });
  return response.data.products;
}

export interface StockAdjustment {
  id: string;
  productId: string;
  previousQuantity: number;
  newQuantity: number;
  difference: number;
  reason: string;
  createdAt: string;
}

export async function adjustProductStock(
  token: string,
  id: string,
  newQuantity: number,
  reason: string
): Promise<{ product: Product; adjustment: StockAdjustment }> {
  const response = await apiRequest<{ data: { product: Product; adjustment: StockAdjustment } }>(
    `/products/${encodeURIComponent(id)}/adjust`,
    {
      method: 'POST',
      headers: authHeaders(token, true),
      body: JSON.stringify({ newQuantity, reason }),
    }
  );
  return response.data;
}

export async function deleteProduct(token: string, id: string): Promise<void> {
  await apiRequest(`/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}

export async function createCategory(token: string, name: string): Promise<Category> {
  const response = await apiRequest<{ data: { category: Category } }>('/categories', {
    method: 'POST',
    headers: authHeaders(token, true),
    body: JSON.stringify({ name }),
  });
  return response.data.category;
}

export async function updateCategory(
  token: string,
  id: string,
  name: string
): Promise<Category> {
  const response = await apiRequest<{ data: { category: Category } }>(
    `/categories/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      headers: authHeaders(token, true),
      body: JSON.stringify({ name }),
    }
  );
  return response.data.category;
}

export async function deleteCategory(token: string, id: string): Promise<void> {
  await apiRequest(`/categories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
}
