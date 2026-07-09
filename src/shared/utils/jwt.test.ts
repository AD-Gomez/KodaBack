import { describe, it, expect } from 'vitest';

import { signAccessToken, verifyAccessToken } from './jwt.js';

describe('jwt utils', () => {
  it('debería firmar y verificar un access token correctamente', () => {
    const token = signAccessToken({ sub: 'user-1', email: 'a@b.com', rol: 'ADMIN' });
    expect(token).toBeTruthy();
    const decoded = verifyAccessToken(token);
    expect(decoded.sub).toBe('user-1');
    expect(decoded.email).toBe('a@b.com');
    expect(decoded.rol).toBe('ADMIN');
  });

  it('debería lanzar error con un token inválido', () => {
    expect(() => verifyAccessToken('token-malformado')).toThrow();
  });
});