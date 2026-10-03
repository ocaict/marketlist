import { Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { query, queryOne, run, withTransaction } from '../services/database';

const createSaleSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int('Quantity must be a whole number').min(1, 'Quantity must be at least 1').max(1_000_000),
      })
    )
    .min(1, 'At least one item is required')
    .max(200),
  discount: z.number().finite().min(0, 'Discount cannot be negative').max(1_000_000_000).optional().default(0),
  paymentMethod: z.enum(['cash', 'transfer', 'pos', 'other']).optional().default('cash'),
});

interface SaleRow {
  id: string;
  user_id: string;
  total_amount: number;
  payment_method: string;
  discount_amount: number;
  created_at: string;
}

interface ProductForSale {
  id: string;
  name: string;
  selling_price: number;
  stock_quantity: number;
}

export async function createSale(req: AuthRequest, res: Response): Promise<void> {
  const input = createSaleSchema.parse(req.body);

  // Reject duplicate product lines — quantities are merged per product.
  const quantities = new Map<string, number>();
  for (const item of input.items) {
    quantities.set(item.productId, (quantities.get(item.productId) ?? 0) + item.quantity);
  }

  const result = await withTransaction(async () => {
    let subtotal = 0;
    const lines: Array<{
      product: ProductForSale;
      quantity: number;
      unitPrice: number;
      lineSubtotal: number;
    }> = [];

    for (const [productId, quantity] of quantities) {
      const product = await queryOne<ProductForSale>(
        'SELECT id, name, selling_price, stock_quantity FROM products WHERE id = ? AND user_id = ?',
        [productId, req.user!.id]
      );
      if (!product) {
        throw new AppError(`Product not found: ${productId}`, 404);
      }
      if (product.stock_quantity < quantity) {
        throw new AppError(
          `Insufficient stock for "${product.name}": requested ${quantity}, available ${product.stock_quantity}`,
          409
        );
      }
      const unitPrice = product.selling_price;
      const lineSubtotal = unitPrice * quantity;
      subtotal += lineSubtotal;
      lines.push({ product, quantity, unitPrice, lineSubtotal });
    }

    const discount = input.discount;
    if (discount > subtotal) {
      throw new AppError('Discount cannot exceed the subtotal', 400);
    }
    const total = Math.max(subtotal - discount, 0);

    const saleId = crypto.randomUUID();
    const now = new Date().toISOString();
    await run(
      'INSERT INTO sales (id, user_id, total_amount, payment_method, discount_amount, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [saleId, req.user!.id, total, input.paymentMethod, discount, now]
    );

    for (const line of lines) {
      await run(
        'INSERT INTO sale_items (id, sale_id, product_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
        [crypto.randomUUID(), saleId, line.product.id, line.quantity, line.unitPrice, line.lineSubtotal]
      );
      await run(
        'UPDATE products SET stock_quantity = stock_quantity - ?, updated_at = ? WHERE id = ? AND user_id = ?',
        [line.quantity, now, line.product.id, req.user!.id]
      );
      await run(
        `INSERT INTO stock_adjustments (id, user_id, product_id, previous_quantity, new_quantity, difference, reason, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          crypto.randomUUID(),
          req.user!.id,
          line.product.id,
          line.product.stock_quantity,
          line.product.stock_quantity - line.quantity,
          -line.quantity,
          `Sale ${saleId}`,
          now,
        ]
      );
    }

    return { saleId, subtotal, discount, total };
  });

  const sale = await getSaleById(req.user!.id, result.saleId);
  res.status(201).json({ status: 'success', data: { sale } });
}

async function getSaleById(userId: string, saleId: string) {
  const sale = await queryOne<SaleRow>(
    'SELECT id, user_id, total_amount, payment_method, discount_amount, created_at FROM sales WHERE id = ? AND user_id = ?',
    [saleId, userId]
  );
  if (!sale) {
    return null;
  }
  const items = await query(
    `SELECT si.id, si.product_id AS "productId", p.name AS "productName", si.quantity,
            si.unit_price AS "unitPrice", si.subtotal
     FROM sale_items si
     LEFT JOIN products p ON p.id = si.product_id
     WHERE si.sale_id = ?
     ORDER BY si.id ASC`,
    [saleId]
  );
  const subtotal = items.reduce((sum, item) => sum + (item as { subtotal: number }).subtotal, 0);
  return {
    id: sale.id,
    subtotal,
    discount: sale.discount_amount,
    total: sale.total_amount,
    paymentMethod: sale.payment_method,
    createdAt: sale.created_at,
    items,
  };
}

function getRangeStart(range: string): { start: Date | null; end: Date | null } {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (range) {
    case 'today':
      return { start: startOfDay, end: null };
    case 'yesterday': {
      const start = new Date(startOfDay);
      start.setDate(start.getDate() - 1);
      return { start, end: startOfDay };
    }
    case 'last7days': {
      const start = new Date(startOfDay);
      start.setDate(start.getDate() - 6);
      return { start, end: null };
    }
    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start, end: null };
    }
    default:
      throw new AppError(`Invalid range: ${range}. Use today, yesterday, last7days, or month.`, 400);
  }
}

export async function getSales(req: AuthRequest, res: Response): Promise<void> {
  let rangeFilter = '';
  const params: unknown[] = [req.user!.id];

  const range = typeof req.query.range === 'string' ? req.query.range : null;
  if (range) {
    const { start, end } = getRangeStart(range);
    if (start) {
      rangeFilter += ' AND created_at >= ?';
      params.push(start.toISOString());
    }
    if (end) {
      rangeFilter += ' AND created_at < ?';
      params.push(end.toISOString());
    }
  }

  const sales = await query<SaleRow>(
    `SELECT id, user_id, total_amount, payment_method, discount_amount, created_at FROM sales
     WHERE user_id = ?${rangeFilter}
     ORDER BY created_at DESC, id DESC`,
    params
  );

  const data = await Promise.all(sales.map(async (sale) => {
    const countRow = await queryOne<{ count: number }>(
      'SELECT COUNT(*)::int AS count FROM sale_items WHERE sale_id = ?',
      [sale.id]
    );
    return {
      id: sale.id,
      total: sale.total_amount,
      subtotal: sale.total_amount + sale.discount_amount,
      discount: sale.discount_amount,
      paymentMethod: sale.payment_method,
      createdAt: sale.created_at,
      itemCount: countRow?.count ?? 0,
    };
  }));
  res.status(200).json({ status: 'success', data: { sales: data } });
}

export async function getSale(req: AuthRequest, res: Response): Promise<void> {
  const sale = await getSaleById(req.user!.id, req.params.id);
  if (!sale) {
    throw new AppError('Sale not found', 404);
  }
  res.status(200).json({ status: 'success', data: { sale } });
}
