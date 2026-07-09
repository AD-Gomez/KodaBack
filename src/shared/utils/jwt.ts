import jwt, { type SignOptions } from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';

import { env } from '../../config/env.js';

export interface JwtPayload {
  sub: string;
  email: string;
  rol: string;
  jti?: string;
}

export function signAccessToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    jwtid: uuid(),
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function signRefreshToken(payload: { sub: string }): string {
  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
    jwtid: uuid(),
  };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}

export function verifyRefreshToken(token: string): { sub: string; jti?: string } {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string; jti?: string };
}

export function refreshExpiresAt(): Date {
  // expiresIn viene como string ('7d', '2h', etc.) - parseamos el número + unidad
  const raw = env.JWT_REFRESH_EXPIRES_IN;
  const match = raw.match(/^(\d+)([smhdw])$/);
  if (!match) {
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
  const value = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
  };
  return new Date(Date.now() + value * multipliers[unit]);
}