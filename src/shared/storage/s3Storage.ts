import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';

import { env } from '../../config/env.js';
import { logger } from '../logger.js';

let cachedClient: S3Client | null = null;

function getBucket(): string | undefined {
  return env.AWS_S3_BUCKET ?? env.AWS_STORAGE_BUCKET_NAME;
}

function getRegion(): string {
  return env.AWS_REGION ?? env.AWS_S3_REGION_NAME ?? 'us-east-1';
}

function getClient(): S3Client {
  if (cachedClient) return cachedClient;
  const bucket = getBucket();
  if (!bucket || !env.AWS_ACCESS_KEY_ID || !env.AWS_SECRET_ACCESS_KEY) {
    throw new Error(
      'S3 no está configurado. Define el bucket, AWS_ACCESS_KEY_ID y AWS_SECRET_ACCESS_KEY.',
    );
  }
  cachedClient = new S3Client({
    region: getRegion(),
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });
  return cachedClient;
}

function buildPublicUrl(key: string): string {
  const bucket = getBucket();
  const region = getRegion();
  if (env.AWS_S3_PUBLIC_URL) {
    const base = env.AWS_S3_PUBLIC_URL.replace(/\/+$/, '');
    return `${base}/${key}`;
  }
  if (!bucket) {
    throw new Error('El bucket de S3 es requerido para construir la URL pública');
  }
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

function guessContentType(filename: string, fallback = 'application/octet-stream'): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'heic':
      return 'image/heic';
    case 'pdf':
      return 'application/pdf';
    default:
      return fallback;
  }
}

export interface UploadInput {
  buffer: Buffer;
  filename: string;
  contentType?: string;
  prefix: string;
}

export async function uploadBuffer({ buffer, filename, contentType, prefix }: UploadInput): Promise<{
  key: string;
  url: string;
}> {
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = `${prefix.replace(/\/+$/, '')}/${randomUUID()}-${safeName}`;
  const bucket = getBucket();
  if (!bucket) {
    throw new Error('El bucket de S3 es requerido para subir archivos');
  }
  const client = getClient();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType ?? guessContentType(filename),
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );
  logger.info({ key, bucket }, 'Archivo subido a S3');
  return { key, url: buildPublicUrl(key) };
}

export async function getObjectBuffer(key: string): Promise<Buffer> {
  const bucket = getBucket();
  if (!bucket) {
    throw new Error('El bucket de S3 es requerido para descargar archivos');
  }
  const client = getClient();
  const res = await client.send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );
  if (!res.Body) throw new Error(`S3 object ${key} sin body`);
  const chunks: Buffer[] = [];
  // @ts-expect-error - Body es un Readable en Node runtime
  for await (const chunk of res.Body) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export { buildPublicUrl, getClient as getS3Client };