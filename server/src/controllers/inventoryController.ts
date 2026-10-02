import { Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { query, queryOne, run, withTransaction } from '../services/database';

const adjustmentSchema = z.object({
  newQuantity: z
    .number()
    .int('Quantity must be a whole number')
    .min(0, 'Quantity cannot be negative')
    .max(1_000_000_000),
  reason: z.string().trim().min(1, 'Reason is required').max(200),
});

interface ProductRecord {
  id: string;
  userId: string;
  categoryId: string | null;
  category: string | null;
  name: string;
  sku: string | null;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

const productSelect = `
  SELECT p.id, p.user_id AS userId, p.category_id AS categoryId,
         c.name AS category, p.name, p.sku, p.cost_price AS costPrice,
         p.selling_price AS sellingPrice, p.stock_quantity AS stockQuantity,
         p.low_stock_threshold AS lowStockThreshold, p.image_url AS imageUrl,
         p.created_at AS createdAt, p.updated_at AS updatedAt
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id AND c.user_id = p.user_id
`;

export function getLowStockProducts(req: AuthRequest, res: Response): void {
  const products = query<ProductRecord>(
    `${productSelect} WHERE p.user_id = ? AND p.stock_quantity <= p.low_stock_threshold
     ORDER BY p.stock_quantity ASC, p.name COLLATE NOCASE`,
    [req.user!.id]
  );
  res.status(200).json({ status: 'success', data: { products } });
}

export function adjustStock(req: AuthRequest, res: Response): void {
  const { newQuantity, reason } = adjustmentSchema.parse(req.body);

  const product = queryOne<{ id: string; stock_quantity: number }>(
    'SELECT id, stock_quantity FROM products WHERE id = ? AND user_id = ?',
    [req.params.id, req.user!.id]
  );
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const previousQuantity = product.stock_quantity;
  const difference = newQuantity - previousQuantity;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  withTransaction(() => {
    run(
      'UPDATE products SET stock_quantity = ?, updated_at = ? WHERE id = ? AND user_id = ?',
      [newQuantity, now, req.params.id, req.user!.id]
    );
    run(
      `INSERT INTO stock_adjustments
        (id, user_id, product_id, previous_quantity, new_quantity, difference, reason, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.user!.id, req.params.id, previousQuantity, newQuantity, difference, reason, now]
    );
  });

  const updated = queryOne<ProductRecord>(
    `${productSelect} WHERE p.id = ? AND p.user_id = ?`,
    [req.params.id, req.user!.id]
  );

  res.status(200).json({
    status: 'success',
    data: {
      product: updated,
      adjustment: {
        id,
        productId: req.params.id,
        previousQuantity,
        newQuantity,
        difference,
        reason,
        createdAt: now,
      },
    },
  });
}

export function getStockAdjustments(req: AuthRequest, res: Response): void {
  const product = queryOne<{ id: string }>(
    'SELECT id FROM products WHERE id = ? AND user_id = ?',
    [req.params.id, req.user!.id]
  );
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const adjustments = query(
    `SELECT id, product_id AS productId, previous_quantity AS previousQuantity,
            new_quantity AS newQuantity, difference, reason, created_at AS createdAt
     FROM stock_adjustments
     WHERE product_id = ? AND user_id = ?
     ORDER BY created_at DESC, rowid DESC`,
    [req.params.id, req.user!.id]
  );
  res.status(200).json({ status: 'success', data: { adjustments } });
}
