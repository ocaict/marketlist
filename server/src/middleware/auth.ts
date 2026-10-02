import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError } from './errorHandler';
import { queryOne } from '../services/database';
import { User } from '../types/database';

export interface AuthRequest extends Request {
  user?: User;
}

interface JwtPayload {
  userId: string;
  email: string;
}

export function authenticateToken(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    throw new AppError('Access token required', 401);
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    const user = queryOne<User>(
      'SELECT id, name, email, phone, business_name, created_at, updated_at FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!user) {
      throw new AppError('User not found', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Invalid or expired token', 401);
  }
}
