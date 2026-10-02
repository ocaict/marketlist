import { apiRequest } from './api';

export interface DashboardData {
  period: 'today' | 'last7days' | 'month' | 'all';
  todaysSales: number;
  todaysTransactionCount: number;
  totalProducts: number;
  lowStockCount: number;
  recentSales: Array<{ id: string; total: number; paymentMethod: string; createdAt: string }>;
  topProducts: Array<{ id: string; name: string; quantitySold: number; revenue: number }>;
  estimatedGrossProfit: number;
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

export async function fetchDashboard(
  token: string,
  period?: 'today' | 'last7days' | 'month' | 'all'
): Promise<DashboardData> {
  const queryString = period ? `?period=${period}` : '';
  const response = await apiRequest<{ data: DashboardData }>(`/dashboard${queryString}`, {
    headers: authHeaders(token),
  });
  return response.data;
}
