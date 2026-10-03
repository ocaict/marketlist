import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3600'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_ENDPOINT_URL_S3: z.string().optional(),
  AWS_REGION: z.string().default('us-east-2'),
  S3_BUCKET: z.string().default('marketlistimages'),
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  console.error('Invalid environment variables:');
  console.error(parseResult.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  port: parseInt(parseResult.data.PORT, 10),
  nodeEnv: parseResult.data.NODE_ENV,
  databaseUrl: parseResult.data.DATABASE_URL,
  jwtSecret: parseResult.data.JWT_SECRET,
  jwtExpiresIn: parseResult.data.JWT_EXPIRES_IN,
  corsOrigin: parseResult.data.CORS_ORIGIN,
  awsAccessKeyId: parseResult.data.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: parseResult.data.AWS_SECRET_ACCESS_KEY,
  awsEndpointUrlS3: parseResult.data.AWS_ENDPOINT_URL_S3,
  awsRegion: parseResult.data.AWS_REGION,
  s3Bucket: parseResult.data.S3_BUCKET,
} as const;
