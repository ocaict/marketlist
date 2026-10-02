import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config';
import { query, queryOne, run } from '../services/database';
import { AppError } from '../middleware/errorHandler';
import { User } from '../types/database';
import { AuthRequest } from '../middleware/auth';
import crypto from 'crypto';

// Validation schemas
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').max(255),
  phone: z.string().min(7, 'Phone number must be at least 7 characters').max(20).optional(),
  businessName: z.string().min(2, 'Business name must be at least 2 characters').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const validated = registerSchema.parse(req.body);

    // Normalize email
    const normalizedEmail = validated.email.toLowerCase().trim();

    // Check for duplicate email
    const existingUser = queryOne<User>('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existingUser) {
      throw new AppError('Email already registered', 409);
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(validated.password, saltRounds);

    // Create user
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();

    run(
      `INSERT INTO users (id, name, email, phone, business_name, password_hash, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, validated.name, normalizedEmail, validated.phone || null, validated.businessName, passwordHash, now, now]
    );

    // Generate JWT
    const token = jwt.sign(
      { userId, email: normalizedEmail },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn } as SignOptions
    );

    // Fetch created user (without password_hash)
    const user = queryOne<User>(
      'SELECT id, name, email, phone, business_name, created_at, updated_at FROM users WHERE id = ?',
      [userId]
    );

    res.status(201).json({
      status: 'success',
      message: 'Registration successful',
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        status: 'error',
        message: error.message,
      });
      return;
    }
    throw error;
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const validated = loginSchema.parse(req.body);

    // Normalize email
    const normalizedEmail = validated.email.toLowerCase().trim();

    // Find user
    const user = queryOne<User>(
      'SELECT * FROM users WHERE email = ?',
      [normalizedEmail]
    );

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(validated.password, user.password_hash);
    if (!isValidPassword) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: normalizedEmail },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn } as SignOptions
    );

    // Remove password_hash from response
    const { password_hash: _, ...userWithoutPassword } = user;

    res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        status: 'error',
        message: error.message,
      });
      return;
    }
    throw error;
  }
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401);
    }

    res.status(200).json({
      status: 'success',
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        status: 'error',
        message: error.message,
      });
      return;
    }
    throw error;
  }
}
