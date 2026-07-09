import { describe, it, expect } from 'vitest';

import { hashPassword, verifyPassword } from './password.js';

describe('password utils', () => {
  it('debería hashear y verificar una contraseña correctamente', async () => {
    const hash = await hashPassword('mi-password-123');
    expect(hash).toBeTruthy();
    expect(hash).not.toBe('mi-password-123');
    const matches = await verifyPassword('mi-password-123', hash);
    expect(matches).toBe(true);
  });

  it('debería rechazar una contraseña incorrecta', async () => {
    const hash = await hashPassword('correcta');
    const matches = await verifyPassword('incorrecta', hash);
    expect(matches).toBe(false);
  });
});