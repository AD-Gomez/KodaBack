import type { Notificacion } from '@prisma/client';
import type { Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../../../config/database.js';
import { authMiddleware } from '../../../shared/middleware/authMiddleware.js';
import { validate } from '../../../shared/middleware/validate.js';
import { asyncHandler } from '../../../shared/utils/asyncHandler.js';

import {
  ListNotificacionesUseCase,
  MarkAllNotificacionesAsReadUseCase,
  MarkNotificacionAsReadUseCase,
} from '../application/NotificacionUseCases.js';
import { PrismaNotificacionRepository } from '../infrastructure/PrismaNotificacionRepository.js';

const idParamSchema = z.object({ id: z.string().uuid('ID inválido') });

function toResponse(notification: Notificacion) {
  return {
    id: notification.id,
    type: notification.tipo,
    title: notification.titulo,
    description: notification.descripcion,
    link: notification.enlace,
    read: Boolean(notification.leidaAt),
    createdAt: notification.createdAt,
  };
}

export function createNotificacionesRouter(): Router {
  const router = Router();
  router.use(authMiddleware);

  const repository = new PrismaNotificacionRepository(prisma);
  const listUseCase = new ListNotificacionesUseCase(repository);
  const markAsReadUseCase = new MarkNotificacionAsReadUseCase(repository);
  const markAllAsReadUseCase = new MarkAllNotificacionesAsReadUseCase(repository);

  router.get(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
      const notifications = await listUseCase.execute(req.user!.id);
      res.json({ success: true, data: notifications.map(toResponse) });
    }),
  );

  router.post(
    '/leer-todas',
    asyncHandler(async (req: Request, res: Response) => {
      const updated = await markAllAsReadUseCase.execute(req.user!.id);
      res.json({ success: true, data: { updated } });
    }),
  );

  router.patch(
    '/:id/leer',
    validate(idParamSchema, 'params'),
    asyncHandler(async (req: Request, res: Response) => {
      const notification = await markAsReadUseCase.execute(req.params.id!, req.user!.id);
      res.json({ success: true, data: toResponse(notification) });
    }),
  );

  return router;
}
