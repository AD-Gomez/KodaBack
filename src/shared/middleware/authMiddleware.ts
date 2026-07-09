import type { NextFunction, Request, Response } from 'express';

import { UnauthorizedError } from '../errors/index.js';
import { verifyAccessToken } from '../utils/jwt.js';

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Token de autenticación requerido'));
  }

  const token = header.slice(7).trim();

  if (!token) {
    return next(new UnauthorizedError('Token de autenticación requerido'));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      rol: payload.rol,
    };
    next();
  } catch {
    next(new UnauthorizedError('Token inválido o expirado'));
  }
}

/**
 * Restringe el acceso a ciertos roles. Acepta uno o varios roles permitidos.
 */
export function requireRoles(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }
    if (!roles.includes(req.user.rol)) {
      return next(new UnauthorizedError('No tiene permisos para realizar esta acción'));
    }
    next();
  };
}