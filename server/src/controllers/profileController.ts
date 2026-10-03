import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { queryOne, run } from '../services/database';
import { User } from '../types/database';

const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100).optional(),
  businessName: z.string().trim().min(2, 'Business name must be at least 2 characters').max(255).optional(),
  phone: z
    .string()
    .trim()
    .min(7, 'Phone number must be at least 7 characters')
    .max(20)
    .nullable()
    .optional(),
  email: z.string().trim().email('Invalid email address').max(255).optional(),
});

const userSelect =
  'SELECT id, name, email, phone, business_name, created_at, updated_at FROM users WHERE id = ?';

export async function getProfile(req: AuthRequest, res: Response): Promise<void> {
  const user = await queryOne<User>(userSelect, [req.user!.id]);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  res.status(200).json({ status: 'success', data: { user } });
}

export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  const input = updateProfileSchema.parse(req.body);

  if (Object.values(input).every((value) => value === undefined)) {
    throw new AppError('No fields to update', 400);
  }

  const updates: string[] = [];
  const params: unknown[] = [];

  if (input.name !== undefined) {
    updates.push('name = ?');
    params.push(input.name);
  }
  if (input.businessName !== undefined) {
    updates.push('business_name = ?');
    params.push(input.businessName);
  }
  if (input.phone !== undefined) {
    updates.push('phone = ?');
    params.push(input.phone === '' ? null : input.phone);
  }
  if (input.email !== undefined) {
    const normalizedEmail = input.email.toLowerCase();
    const existing = await queryOne<User>('SELECT id FROM users WHERE email = ? AND id != ?', [
      normalizedEmail,
      req.user!.id,
    ]);
    if (existing) {
      throw new AppError('Email already in use by another account', 409);
    }
    updates.push('email = ?');
    params.push(normalizedEmail);
  }

  updates.push('updated_at = ?');
  params.push(new Date().toISOString());
  params.push(req.user!.id);

  await run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

  const user = await queryOne<User>(userSelect, [req.user!.id]);
  res.status(200).json({
    status: 'success',
    message: 'Profile updated successfully',
    data: { user },
  });
}
