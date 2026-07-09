import { Router } from 'express';

import { prisma } from '../../../config/database.js';
import { authMiddleware } from '../../../shared/middleware/authMiddleware.js';
import { validate } from '../../../shared/middleware/validate.js';

import {
  CreateReparacionUseCase,
  CreateServicioUseCase,
  DeleteReparacionUseCase,
  DeleteServicioUseCase,
  GetReparacionStatsUseCase,
  GetReparacionUseCase,
  GetServicioUseCase,
  ListReparacionesUseCase,
  ListServiciosUseCase,
  UpdateReparacionUseCase,
  UpdateServicioUseCase,
} from '../application/ReparacionUseCases.js';
import { PrismaReparacionRepository } from '../infrastructure/PrismaReparacionRepository.js';
import { PrismaServicioActivoRepository } from '../infrastructure/PrismaServicioActivoRepository.js';

import { ReparacionController } from './ReparacionController.js';
import {
  createReparacionSchema,
  createServicioSchema,
  idParamSchema,
  listReparacionesQuerySchema,
  listServiciosQuerySchema,
  updateReparacionSchema,
  updateServicioSchema,
} from './reparacionValidators.js';

export function createReparacionesRouter(): Router {
  const router = Router();
  router.use(authMiddleware);

  const reparacionRepo = new PrismaReparacionRepository(prisma);
  const servicioRepo = new PrismaServicioActivoRepository(prisma);

  const controller = new ReparacionController(
    new ListReparacionesUseCase(reparacionRepo),
    new GetReparacionUseCase(reparacionRepo),
    new CreateReparacionUseCase(reparacionRepo),
    new UpdateReparacionUseCase(reparacionRepo),
    new DeleteReparacionUseCase(reparacionRepo),
    new GetReparacionStatsUseCase(reparacionRepo),
    new ListServiciosUseCase(servicioRepo),
    new GetServicioUseCase(servicioRepo),
    new CreateServicioUseCase(servicioRepo),
    new UpdateServicioUseCase(servicioRepo),
    new DeleteServicioUseCase(servicioRepo),
  );

  // Reparaciones
  router.get('/stats', controller.stats);
  router.get('/', validate(listReparacionesQuerySchema, 'query'), controller.list);
  router.get('/:id', validate(idParamSchema, 'params'), controller.get);
  router.post('/', validate(createReparacionSchema), controller.create);
  router.put('/:id', validate(idParamSchema, 'params'), validate(updateReparacionSchema), controller.update);
  router.delete('/:id', validate(idParamSchema, 'params'), controller.delete);

  // Servicios activos
  router.get('/servicios/all', validate(listServiciosQuerySchema, 'query'), controller.listServicios);
  router.get('/servicios/:id', validate(idParamSchema, 'params'), controller.getServicio);
  router.post('/servicios', validate(createServicioSchema), controller.createServicio);
  router.put('/servicios/:id', validate(idParamSchema, 'params'), validate(updateServicioSchema), controller.updateServicio);
  router.delete('/servicios/:id', validate(idParamSchema, 'params'), controller.deleteServicio);

  return router;
}