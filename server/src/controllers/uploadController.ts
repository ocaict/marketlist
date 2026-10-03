import { Response } from 'express';
import { z } from 'zod';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { config } from '../config';

const uploadSchema = z.object({
  dataUrl: z
    .string()
    .regex(/^data:image\/(jpeg|jpg|png|webp);base64,/, 'Image must be a JPEG, PNG, or WebP data URL'),
});

const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB decoded

function getS3Client(): S3Client {
  if (!config.awsAccessKeyId || !config.awsSecretAccessKey || !config.awsEndpointUrlS3) {
    throw new AppError('Image storage is not configured on the server', 503);
  }
  return new S3Client({
    region: config.awsRegion,
    endpoint: config.awsEndpointUrlS3,
    credentials: {
      accessKeyId: config.awsAccessKeyId,
      secretAccessKey: config.awsSecretAccessKey,
    },
    forcePathStyle: true,
  });
}

export async function uploadProductImage(req: AuthRequest, res: Response): Promise<void> {
  const { dataUrl } = uploadSchema.parse(req.body);
  const commaIndex = dataUrl.indexOf(',');
  const base64 = dataUrl.slice(commaIndex + 1);
  const buffer = Buffer.from(base64, 'base64');

  if (buffer.length === 0) {
    throw new AppError('Empty image data', 400);
  }
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new AppError('Image must be smaller than 2MB', 400);
  }

  const mimeMatch = dataUrl.match(/^data:(image\/\w+);base64,/);
  const contentType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const extension = contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : 'jpg';
  const key = `products/${req.user!.id}/${crypto.randomUUID()}.${extension}`;

  const s3 = getS3Client();
  await s3.send(
    new PutObjectCommand({
      Bucket: config.s3Bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  const endpoint = config.awsEndpointUrlS3!.replace(/\/$/, '');
  const url = `${endpoint}/${config.s3Bucket}/${key}`;
  res.status(201).json({ status: 'success', data: { url } });
}
