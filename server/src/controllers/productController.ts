import { Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { query, queryOne, run } from '../services/database';

const productSchema = z.object({
  name: z.string().trim().min(1, 'Product name is required').max(200),
  categoryId: z.string().min(1).nullable().optional(),
  sku: z.string().trim().max(100).nullable().optional(),
  costPrice: z.number().finite().min(0).max(1_000_000_000),
  sellingPrice: z.number().finite().min(0).max(1_000_000_000),
  stockQuantity: z.number().int().min(0).max(1_000_000_000),
  lowStockThreshold: z.number().int().min(0).max(1_000_000_000),
  imageUrl: z.string().url().nullable().optional(),
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
  SELECT p.id, p.user_id AS "userId", p.category_id AS "categoryId",
         c.name AS category, p.name, p.sku, p.cost_price AS "costPrice",
         p.selling_price AS "sellingPrice", p.stock_quantity AS "stockQuantity",
         p.low_stock_threshold AS "lowStockThreshold", p.image_url AS "imageUrl",
         p.created_at AS "createdAt", p.updated_at AS "updatedAt"
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id AND c.user_id = p.user_id
`;

async function ensureOwnedCategory(categoryId: string | null | undefined, userId: string): Promise<void> {
  if (categoryId == null) {
    return;
  }

  const category = await queryOne<{ id: string }>(
    'SELECT id FROM categories WHERE id = ? AND user_id = ?',
    [categoryId, userId]
  );
  if (!category) {
    throw new AppError('Category not found', 400);
  }
}

export async function getProducts(req: AuthRequest, res: Response): Promise<void> {
  const products = await query<ProductRecord>(
    `${productSelect} WHERE p.user_id = ? ORDER BY LOWER(p.name)`,
    [req.user!.id]
  );
  res.status(200).json({ status: 'success', data: { products } });
}

export async function getProduct(req: AuthRequest, res: Response): Promise<void> {
  const product = await queryOne<ProductRecord>(
    `${productSelect} WHERE p.id = ? AND p.user_id = ?`,
    [req.params.id, req.user!.id]
  );

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  res.status(200).json({ status: 'success', data: { product } });
}

export async function createProduct(req: AuthRequest, res: Response): Promise<void> {
  const product = productSchema.parse(req.body);
  await ensureOwnedCategory(product.categoryId, req.user!.id);

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await run(
    `INSERT INTO products
      (id, user_id, category_id, name, sku, cost_price, selling_price,
       stock_quantity, low_stock_threshold, image_url, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      req.user!.id,
      product.categoryId ?? null,
      product.name,
      product.sku || null,
      product.costPrice,
      product.sellingPrice,
      product.stockQuantity,
      product.lowStockThreshold,
      product.imageUrl ?? null,
      now,
      now,
    ]
  );

  const created = await queryOne<ProductRecord>(
    `${productSelect} WHERE p.id = ? AND p.user_id = ?`,
    [id, req.user!.id]
  );
  res.status(201).json({ status: 'success', data: { product: created } });
}

export async function updateProduct(req: AuthRequest, res: Response): Promise<void> {
  const product = productSchema.parse(req.body);
  const existing = await queryOne<{ id: string }>(
    'SELECT id FROM products WHERE id = ? AND user_id = ?',
    [req.params.id, req.user!.id]
  );

  if (!existing) {
    throw new AppError('Product not found', 404);
  }
  await ensureOwnedCategory(product.categoryId, req.user!.id);

  await run(
    `UPDATE products SET category_id = ?, name = ?, sku = ?, cost_price = ?,
       selling_price = ?, stock_quantity = ?, low_stock_threshold = ?, image_url = ?, updated_at = ?
     WHERE id = ? AND user_id = ?`,
    [
      product.categoryId ?? null,
      product.name,
      product.sku || null,
      product.costPrice,
      product.sellingPrice,
      product.stockQuantity,
      product.lowStockThreshold,
      product.imageUrl ?? null,
      new Date().toISOString(),
      req.params.id,
      req.user!.id,
    ]
  );

  const updated = await queryOne<ProductRecord>(
    `${productSelect} WHERE p.id = ? AND p.user_id = ?`,
    [req.params.id, req.user!.id]
  );
  res.status(200).json({ status: 'success', data: { product: updated } });
}

export async function deleteProduct(req: AuthRequest, res: Response): Promise<void> {
  const existing = await queryOne<{ id: string }>(
    'SELECT id FROM products WHERE id = ? AND user_id = ?',
    [req.params.id, req.user!.id]
  );
  if (!existing) {
    throw new AppError('Product not found', 404);
  }

  const saleItem = await queryOne<{ id: string }>(
    'SELECT id FROM sale_items WHERE product_id = ? LIMIT 1',
    [req.params.id]
  );
  if (saleItem) {
    throw new AppError('Products included in sales cannot be deleted', 409);
  }

  await run('DELETE FROM products WHERE id = ? AND user_id = ?', [req.params.id, req.user!.id]);
  res.status(204).send();
}
