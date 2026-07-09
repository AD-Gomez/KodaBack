import compression from 'compression';
import cors from 'cors';
import express, { type Application, Router } from 'express';
import helmet from 'helmet';

import { env } from './config/env.js';
import { logger } from './shared/logger.js';
import { errorHandler, notFoundHandler } from './shared/middleware/errorHandler.js';
import { generalRateLimiter } from './shared/middleware/rateLimiter.js';
import { httpLogger } from './shared/middleware/requestLogger.js';
import { createAuthRouter } from './modules/auth/index.js';
import { createArrendatariosRouter } from './modules/arrendatarios/index.js';
import { createContratosRouter } from './modules/contratos/index.js';
import { createDashboardRouter } from './modules/dashboard/index.js';
import { createDepartamentosRouter } from './modules/departamentos/index.js';
import { createReparacionesRouter } from './modules/reparaciones/index.js';

export function createApp(): Application {
  const app = express();

  // Seguridad y parsing
  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((s) => s.trim()),
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Logging
  app.use(httpLogger);

  // Rate limiting
  app.use(generalRateLimiter);

  // Health check
  app.get('/health', (_req, res) => {
    res.json({
      success: true,
      data: {
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        env: env.NODE_ENV,
      },
    });
  });

  // API v1
  const apiRouter = Router();
  apiRouter.use('/auth', createAuthRouter());
  apiRouter.use('/dashboard', createDashboardRouter());
  apiRouter.use('/departamentos', createDepartamentosRouter());
  apiRouter.use('/arrendatarios', createArrendatariosRouter());
  apiRouter.use('/reparaciones', createReparacionesRouter());
  apiRouter.use('/contratos', createContratosRouter());

  app.use(env.API_PREFIX, apiRouter);

  // 404 y errores
  app.use(notFoundHandler);
  app.use(errorHandler);

  logger.info({ env: env.NODE_ENV, port: env.PORT }, 'App inicializada');

  return app;
}