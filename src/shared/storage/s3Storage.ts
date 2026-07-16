import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';

import { env } from '../../config/env.js';
import { logger } from '../logger.js';

let cachedClient: S3Client | null = null;

const SIGNED_URL_EXPIRES_IN_SECONDS = 15 * 60;

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

function buildConfiguredPublicUrl(key: string): string | null {
  if (!env.AWS_S3_PUBLIC_URL) return null;

  const base = env.AWS_S3_PUBLIC_URL.replace(/\/+$/, '');
  return `${base}/${key}`;
}

/**
 * Obtiene la key de una referencia persistida en la base de datos.
 * Acepta tanto las URLs S3 históricas como keys nuevas para mantener
 * compatibilidad sin una migración de datos.
 */
export function getObjectKey(reference: string, configuredBucket = getBucket()): string | null {
  const value = reference.trim();
  if (!value) return null;

  if (!/^https?:\/\//i.test(value)) {
    return value.replace(/^\/+/, '') || null;
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }

  if (!configuredBucket) return null;

  const hostname = parsed.hostname.toLowerCase();
  const normalizedBucket = configuredBucket.toLowerCase();
  const isVirtualHostedS3 =
    hostname === `${normalizedBucket}.s3.amazonaws.com` ||
    hostname.startsWith(`${normalizedBucket}.s3.`) ||
    hostname.startsWith(`${normalizedBucket}.s3-`);

  let encodedKey: string | undefined;
  if (isVirtualHostedS3) {
    encodedKey = parsed.pathname.replace(/^\/+/, '');
  } else if (/^s3(?:[.-][a-z0-9-]+)?\.amazonaws\.com$/i.test(hostname)) {
    const path = parsed.pathname.replace(/^\/+/, '');
    const bucketPrefix = `${configuredBucket}/`;
    if (path.toLowerCase().startsWith(bucketPrefix.toLowerCase())) {
      encodedKey = path.slice(bucketPrefix.length);
    }
  }

  if (!encodedKey) return null;

  try {
    return decodeURIComponent(encodedKey);
  } catch {
    return encodedKey;
  }
}

/** Genera una URL de lectura temporal para objetos del bucket privado. */
export function getSignedObjectUrl(reference: string, expiresIn?: number): Promise<string>;
export function getSignedObjectUrl(reference: null, expiresIn?: number): Promise<null>;
export function getSignedObjectUrl(reference: undefined, expiresIn?: number): Promise<undefined>;
export function getSignedObjectUrl(
  reference: string | null,
  expiresIn?: number,
): Promise<string | null>;
export function getSignedObjectUrl(
  reference: string | null | undefined,
  expiresIn?: number,
): Promise<string | null | undefined>;
export async function getSignedObjectUrl(
  reference: string | null | undefined,
  expiresIn = SIGNED_URL_EXPIRES_IN_SECONDS,
): Promise<string | null | undefined> {
  if (!reference) return reference;

  const key = getObjectKey(reference);
  if (!key) {
    // Las URLs externas o de un CDN público no necesitan firma S3.
    return reference;
  }

  const configuredPublicUrl = buildConfiguredPublicUrl(key);
  if (configuredPublicUrl) return configuredPublicUrl;

  const bucket = getBucket();
  if (!bucket) {
    throw new Error('El bucket de S3 es requerido para firmar URLs');
  }

  return getSignedUrl(
    getClient(),
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
      ResponseCacheControl: 'private, max-age=900',
    }),
    { expiresIn },
  );
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

export async function uploadBuffer({
  buffer,
  filename,
  contentType,
  prefix,
}: UploadInput): Promise<{
  key: string;
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
      CacheControl: 'private, max-age=900',
    }),
  );
  logger.info({ key, bucket }, 'Archivo subido a S3');
  return { key };
}

export async function getObjectBuffer(reference: string): Promise<Buffer> {
  const bucket = getBucket();
  if (!bucket) {
    throw new Error('El bucket de S3 es requerido para descargar archivos');
  }
  const key = getObjectKey(reference);
  if (!key) {
    throw new Error('La referencia no pertenece al bucket S3 configurado');
  }
  const client = getClient();
  const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!res.Body) throw new Error(`S3 object ${key} sin body`);
  const chunks: Buffer[] = [];
  // @ts-expect-error - Body es un Readable en Node runtime
  for await (const chunk of res.Body) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export { getClient as getS3Client };
