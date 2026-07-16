import { describe, expect, it, vi } from 'vitest';

vi.mock('../../config/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    LOG_LEVEL: 'silent',
    LOG_PRETTY: false,
    AWS_REGION: 'us-east-1',
    AWS_S3_BUCKET: 'private-files',
    AWS_ACCESS_KEY_ID: 'test-access-key',
    AWS_SECRET_ACCESS_KEY: 'test-secret-key',
  },
}));

import { getObjectKey, getSignedObjectUrl } from './s3Storage.js';

describe('getObjectKey', () => {
  const bucket = 'private-files';
  const key = 'firmas/contract-id/cedula/foto frente.jpg';

  it('acepta una key persistida directamente', () => {
    expect(getObjectKey(key, bucket)).toBe(key);
  });

  it('extrae la key de las URLs regionales existentes', () => {
    const url = `https://${bucket}.s3.us-east-1.amazonaws.com/firmas/contract-id/cedula/foto%20frente.jpg`;

    expect(getObjectKey(url, bucket)).toBe(key);
  });

  it('extrae la key de URLs S3 path-style', () => {
    const url = `https://s3.us-east-1.amazonaws.com/${bucket}/firmas/contract-id/cedula/foto%20frente.jpg`;

    expect(getObjectKey(url, bucket)).toBe(key);
  });

  it('ignora los parámetros de una URL firmada anterior', () => {
    const url = `https://${bucket}.s3.amazonaws.com/firmas/example.pdf?X-Amz-Signature=expired`;

    expect(getObjectKey(url, bucket)).toBe('firmas/example.pdf');
  });

  it('no interpreta URLs externas como objetos del bucket', () => {
    expect(getObjectKey('https://example.com/image.jpg', bucket)).toBeNull();
  });

  it('genera una URL temporal firmada para objetos privados', async () => {
    const signedUrl = await getSignedObjectUrl('firmas/example.pdf', 60);
    const parsed = new URL(signedUrl);

    expect(parsed.hostname).toBe(`${bucket}.s3.us-east-1.amazonaws.com`);
    expect(parsed.searchParams.get('X-Amz-Expires')).toBe('60');
    expect(parsed.searchParams.get('X-Amz-Signature')).toBeTruthy();
  });

  it('conserva URLs externas sin modificarlas', async () => {
    const externalUrl = 'https://example.com/image.jpg';

    await expect(getSignedObjectUrl(externalUrl)).resolves.toBe(externalUrl);
  });
});
