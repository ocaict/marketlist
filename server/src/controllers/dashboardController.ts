import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { query, queryOne } from '../services/database';

const periodSchema = z.enum(['today', 'last7days', 'month', 'all']).optional().default('today');

function getPeriodStart(period: 'today' | 'last7days' | 'month' | 'all'): Date | null {
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
    case 'all':
      return null;
  }
}

export function getDashboard(req: AuthRequest, res: Response): void {
  const period = periodSchema.parse(req.query.period);
  const userId = req.user!.id;
  const start = getPeriodStart(period);
  const startIso = start ? start.toISOString() : null;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const salesStats = queryOne<{ todaysSales: number; transactionCount: number }>(
    `SELECT COALESCE(SUM(total_amount), 0) AS todaysSales, COUNT(*) AS transactionCount
     FROM sales
     WHERE user_id = ? AND created_at >= ?`,
    [userId, todayStart]
  ) ?? { todaysSales: 0, transactionCount: 0 };

  const productStats = queryOne<{ totalProducts: number; lowStockCount: number }>(
    `SELECT COUNT(*) AS totalProducts,
            SUM(CASE WHEN stock_quantity <= low_stock_threshold THEN 1 ELSE 0 END) AS lowStockCount
     FROM products WHERE user_id = ?`,
    [userId]
  ) ?? { totalProducts: 0, lowStockCount: 0 };

  const recentSales = query(
    `SELECT id, total_amount AS total, payment_method AS paymentMethod, created_at AS createdAt
     FROM sales WHERE user_id = ?
     ORDER BY created_at DESC, rowid DESC
     LIMIT 5`,
    [userId]
  );

  const topProducts = query(
    `SELECT p.id, p.name, SUM(si.quantity) AS quantitySold, SUM(si.subtotal) AS revenue
     FROM sale_items si
     JOIN sales s ON s.id = si.sale_id AND s.user_id = ?
     JOIN products p ON p.id = si.product_id
     WHERE s.user_id = ?${startIso ? ' AND s.created_at >= ?' : ''}
     GROUP BY p.id, p.name
     ORDER BY quantitySold DESC, revenue DESC
     LIMIT 5`,
    startIso ? [userId, userId, startIso] : [userId, userId]
  );

  const profitRow = queryOne<{ estimatedGrossProfit: number }>(
    `SELECT COALESCE(SUM((si.unit_price - p.cost_price) * si.quantity), 0) AS estimatedGrossProfit
     FROM sale_items si
     JOIN sales s ON s.id = si.sale_id
     JOIN products p ON p.id = si.product_id
     WHERE s.user_id = ?${startIso ? ' AND s.created_at >= ?' : ''}`,
    startIso ? [userId, startIso] : [userId]
  ) ?? { estimatedGrossProfit: 0 };

  res.status(200).json({
    status: 'success',
    data: {
      period,
      todaysSales: salesStats.todaysSales,
      todaysTransactionCount: salesStats.transactionCount,
      totalProducts: productStats.totalProducts,
      lowStockCount: productStats.lowStockCount ?? 0,
      recentSales,
      topProducts,
      estimatedGrossProfit: profitRow.estimatedGrossProfit,
    },
  });
}
