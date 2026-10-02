import { apiRequest } from './api';

export interface SaleItem {
  id: string;
  productId: string;
  productName: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: 'cash' | 'transfer' | 'pos' | 'other';
  createdAt: string;
  items?: SaleItem[];
}

export interface SaleListItem {
  id: string;
  total: number;
  discount: number;
  paymentMethod: string;
  createdAt: string;
  itemCount: number;
}

function authHeaders(token: string, json = false): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    ...(json ? { 'Content-Type': 'application/json' } : {}),
  };
}

export async function createSale(
  token: string,
  payload: { items: Array<{ productId: string; quantity: number }>; discount?: number; paymentMethod?: string }
): Promise<Sale> {
  const response = await apiRequest<{ data: { sale: Sale } }>('/sales', {
    method: 'POST',
    headers: authHeaders(token, true),
    body: JSON.stringify(payload),
  });
  return response.data.sale;
}

export async function fetchSales(token: string, range?: 'today' | 'yesterday' | 'last7days' | 'month'): Promise<SaleListItem[]> {
  const queryString = range ? `?range=${range}` : '';
  const response = await apiRequest<{ data: { sales: SaleListItem[] } }>(`/sales${queryString}`, {
    headers: authHeaders(token),
  });
  return response.data.sales;
}

export async function fetchSale(token: string, id: string): Promise<Sale> {
  const response = await apiRequest<{ data: { sale: Sale } }>(`/sales/${encodeURIComponent(id)}`, {
    headers: authHeaders(token),
  });
  return response.data.sale;
}
