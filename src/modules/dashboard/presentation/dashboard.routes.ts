import { Router } from 'express';

import { prisma } from '../../../config/database.js';
import { authMiddleware } from '../../../shared/middleware/authMiddleware.js';

import { DashboardService } from '../application/DashboardService.js';

import { DashboardController } from './DashboardController.js';

export function createDashboardRouter(): Router {
  const router = Router();
  router.use(authMiddleware);

  const service = new DashboardService(prisma);
  const controller = new DashboardController(service);

  router.get('/summary', controller.summary);

  return router;
}