import { Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { query, queryOne, run } from '../services/database';

const categorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(100),
});

interface CategoryRecord {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export async function getCategories(req: AuthRequest, res: Response): Promise<void> {
  const categories = await query<CategoryRecord>(
    `SELECT id, user_id, name, created_at, updated_at
     FROM categories WHERE user_id = ? ORDER BY LOWER(name)`,
    [req.user!.id]
  );

  res.status(200).json({ status: 'success', data: { categories } });
}

export async function createCategory(req: AuthRequest, res: Response): Promise<void> {
  const { name } = categorySchema.parse(req.body);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await run(
    'INSERT INTO categories (id, user_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
    [id, req.user!.id, name, now, now]
  );

  const category = await queryOne<CategoryRecord>(
    'SELECT id, user_id, name, created_at, updated_at FROM categories WHERE id = ? AND user_id = ?',
    [id, req.user!.id]
  );
  res.status(201).json({ status: 'success', data: { category } });
}

export async function updateCategory(req: AuthRequest, res: Response): Promise<void> {
  const { name } = categorySchema.parse(req.body);
  const result = await queryOne<CategoryRecord>(
    'SELECT id, user_id, name, created_at, updated_at FROM categories WHERE id = ? AND user_id = ?',
    [req.params.id, req.user!.id]
  );

  if (!result) {
    throw new AppError('Category not found', 404);
  }

  await run(
    'UPDATE categories SET name = ?, updated_at = ? WHERE id = ? AND user_id = ?',
    [name, new Date().toISOString(), req.params.id, req.user!.id]
  );
  const category = await queryOne<CategoryRecord>(
    'SELECT id, user_id, name, created_at, updated_at FROM categories WHERE id = ? AND user_id = ?',
    [req.params.id, req.user!.id]
  );
  res.status(200).json({ status: 'success', data: { category } });
}

export async function deleteCategory(req: AuthRequest, res: Response): Promise<void> {
  const result = await queryOne<{ id: string }>(
    'SELECT id FROM categories WHERE id = ? AND user_id = ?',
    [req.params.id, req.user!.id]
  );

  if (!result) {
    throw new AppError('Category not found', 404);
  }

  await run('DELETE FROM categories WHERE id = ? AND user_id = ?', [req.params.id, req.user!.id]);
  res.status(204).send();
}
