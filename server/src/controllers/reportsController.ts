import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { query, queryOne } from '../services/database';

const periodSchema = z.enum(['today', 'last7days', 'month']).optional().default('today');

function getPeriodStart(period: 'today' | 'last7days' | 'month'): Date {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (period) {
    case 'today':
      return startOfDay;
    case 'last7days': {
      const start = new Date(startOfDay);
      start.setDate(start.getDate() - 6);
      return start;
    }
    case 'month':
      return new Date(now.getFullYear(), now.getMonth(), 1);
  }
}

export async function getReportSummary(req: AuthRequest, res: Response): Promise<void> {
  const period = periodSchema.parse(req.query.period);
  const userId = req.user!.id;
  const start = getPeriodStart(period);
  const startIso = start.toISOString();

  const totals = await queryOne<{ totalSales: number; transactionCount: number }>(
    `SELECT COALESCE(SUM(total_amount), 0) AS "totalSales", COUNT(*)::int AS "transactionCount"
     FROM sales WHERE user_id = ? AND created_at >= ?`,
    [userId, startIso]
  ) ?? { totalSales: 0, transactionCount: 0 };

  const profit = await queryOne<{ estimatedGrossProfit: number }>(
    `SELECT COALESCE(SUM((si.unit_price - p.cost_price) * si.quantity), 0) AS "estimatedGrossProfit"
     FROM sale_items si
     JOIN sales s ON s.id = si.sale_id
     JOIN products p ON p.id = si.product_id
     WHERE s.user_id = ? AND s.created_at >= ?`,
    [userId, startIso]
  ) ?? { estimatedGrossProfit: 0 };

  const topProducts = await query(
    `SELECT p.id, p.name, SUM(si.quantity)::int AS "quantitySold", SUM(si.subtotal) AS revenue
     FROM sale_items si
     JOIN sales s ON s.id = si.sale_id
     JOIN products p ON p.id = si.product_id
     WHERE s.user_id = ? AND s.created_at >= ?
     GROUP BY p.id, p.name
     ORDER BY "quantitySold" DESC, revenue DESC
     LIMIT 5`,
    [userId, startIso]
  );

  const trendRows = await query<{ day: string; total: number }>(
    `SELECT to_char(created_at, 'YYYY-MM-DD') AS day, SUM(total_amount) AS total
     FROM sales
     WHERE user_id = ? AND created_at >= ?
     GROUP BY day
     ORDER BY day ASC`,
    [userId, startIso]
  );

  // Fill gaps with zero-total days so the chart renders a continuous trend.
  const totalsByDay = new Map(trendRows.map((row) => [row.day, row.total]));
  const salesTrend: Array<{ date: string; total: number }> = [];
  const cursor = new Date(start);
  const todayEnd = new Date();
  while (cursor <= todayEnd) {
    const key = cursor.toISOString().slice(0, 10);
    salesTrend.push({ date: key, total: totalsByDay.get(key) ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  res.status(200).json({
    status: 'success',
    data: {
      period,
      totalSales: totals.totalSales,
      transactionCount: totals.transactionCount,
      estimatedGrossProfit: profit.estimatedGrossProfit,
      topProducts,
      salesTrend,
    },
  });
}
