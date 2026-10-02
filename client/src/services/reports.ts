import { apiRequest } from './api';

export interface ReportSummary {
  period: 'today' | 'last7days' | 'month';
  totalSales: number;
  transactionCount: number;
  estimatedGrossProfit: number;
  topProducts: Array<{ id: string; name: string; quantitySold: number; revenue: number }>;
  salesTrend: Array<{ date: string; total: number }>;
}

export async function fetchReportSummary(
  token: string,
  period?: 'today' | 'last7days' | 'month'
): Promise<ReportSummary> {
  const queryString = period ? `?period=${period}` : '';
  const response = await apiRequest<{ data: ReportSummary }>(`/reports/summary${queryString}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}
