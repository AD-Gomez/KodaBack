import type { Request, Response, NextFunction } from 'express';

type AsyncFunction = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/**
 * Envuelve una función asíncrona para que los errores se propaguen al middleware de errores de Express.
 */
export const asyncHandler =
  (fn: AsyncFunction) => (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };