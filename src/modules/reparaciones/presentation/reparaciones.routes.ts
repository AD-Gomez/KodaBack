import { Router } from 'express';

import { prisma } from '../../../config/database.js';
import { authMiddleware } from '../../../shared/middleware/authMiddleware.js';
import { validate } from '../../../shared/middleware/validate.js';

import {
  AddReparacionFotoUseCase,
  CreateReparacionUseCase,
  CreateServicioUseCase,
  DeleteReparacionUseCase,
  DeleteServicioUseCase,
  GetReparacionStatsUseCase,
  GetReparacionUseCase,
  GetServicioUseCase,
  ListReparacionesUseCase,
  ListServiciosUseCase,
  RemoveReparacionFotoUseCase,
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
  reparacionFotoIdParamSchema,
  reparacionPdfQuerySchema,
  updateReparacionSchema,
  updateServicioSchema,
  uploadReparacionFotoSchema,
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
    new AddReparacionFotoUseCase(reparacionRepo),
    new RemoveReparacionFotoUseCase(reparacionRepo),
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

  // Manifiesto PDF de una reparación
  router.get(
    '/:id/pdf',
    validate(idParamSchema, 'params'),
    validate(reparacionPdfQuerySchema, 'query'),
    controller.pdf,
  );

  // Evidencia fotográfica de una reparación
  router.post(
    '/:id/fotos',
    validate(idParamSchema, 'params'),
    validate(uploadReparacionFotoSchema),
    controller.addFoto,
  );
  router.delete(
    '/:id/fotos/:fotoId',
    validate(reparacionFotoIdParamSchema, 'params'),
    controller.removeFoto,
  );

  // Servicios activos
  router.get('/servicios/all', validate(listServiciosQuerySchema, 'query'), controller.listServicios);
  router.get('/servicios/:id', validate(idParamSchema, 'params'), controller.getServicio);
  router.post('/servicios', validate(createServicioSchema), controller.createServicio);
  router.put('/servicios/:id', validate(idParamSchema, 'params'), validate(updateServicioSchema), controller.updateServicio);
  router.delete('/servicios/:id', validate(idParamSchema, 'params'), controller.deleteServicio);

  return router;
}