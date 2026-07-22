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
import { createConfiguracionRouter } from './modules/configuracion/index.js';
import { createDashboardRouter } from './modules/dashboard/index.js';
import { createDepartamentosRouter } from './modules/departamentos/index.js';
import { createReparacionesRouter } from './modules/reparaciones/index.js';
import { createFirmasPublicRouter } from './modules/firmas-public/firmasPublic.routes.js';
import { createInspeccionesRouter } from './modules/inspecciones/index.js';
import { createNotificacionesRouter } from './modules/notificaciones/index.js';

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

 
  app.use(httpLogger);

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

  // API v1 pública (sin auth, sin rate limit general) — para links de firma
  app.use(env.API_PREFIX, createFirmasPublicRouter());

  // Rate limiting (después de las rutas públicas para no penalizar a los firmantes)
  app.use(generalRateLimiter);

  // API v1 autenticada
  const apiRouter = Router();
  apiRouter.use('/auth', createAuthRouter());
  apiRouter.use('/dashboard', createDashboardRouter());
  apiRouter.use('/departamentos', createDepartamentosRouter());
  apiRouter.use('/arrendatarios', createArrendatariosRouter());
  apiRouter.use('/reparaciones', createReparacionesRouter());
  apiRouter.use('/inspecciones', createInspeccionesRouter());
  apiRouter.use('/contratos', createContratosRouter());
  apiRouter.use('/notificaciones', createNotificacionesRouter());
  apiRouter.use('/configuracion', createConfiguracionRouter());

  app.use(env.API_PREFIX, apiRouter);

  // 404 y errores
  app.use(notFoundHandler);
  app.use(errorHandler);

  logger.info({ env: env.NODE_ENV, port: env.PORT }, 'App inicializada');

  return app;
}
