import { Router } from 'express';

import { prisma } from '../../../config/database.js';
import { authMiddleware } from '../../../shared/middleware/authMiddleware.js';
import { validate } from '../../../shared/middleware/validate.js';

import {
  CreateArrendatarioUseCase,
  DeleteArrendatarioUseCase,
  GetArrendatarioUseCase,
  ListArrendatariosUseCase,
  UpdateArrendatarioUseCase,
} from '../application/ArrendatarioUseCases.js';
import { PrismaArrendatarioRepository } from '../infrastructure/PrismaArrendatarioRepository.js';

import { ArrendatarioController } from './ArrendatarioController.js';
import {
  createArrendatarioSchema,
  idParamSchema,
  listArrendatariosQuerySchema,
  updateArrendatarioSchema,
} from './arrendatarioValidators.js';

export function createArrendatariosRouter(): Router {
  const router = Router();
  router.use(authMiddleware);

  const repository = new PrismaArrendatarioRepository(prisma);
  const listUseCase = new ListArrendatariosUseCase(repository);
  const getUseCase = new GetArrendatarioUseCase(repository);
  const createUseCase = new CreateArrendatarioUseCase(repository);
  const updateUseCase = new UpdateArrendatarioUseCase(repository);
  const deleteUseCase = new DeleteArrendatarioUseCase(repository);

  const controller = new ArrendatarioController(
    listUseCase,
    getUseCase,
    createUseCase,
    updateUseCase,
    deleteUseCase,
  );

  router.get('/', validate(listArrendatariosQuerySchema, 'query'), controller.list);
  router.get('/:id', validate(idParamSchema, 'params'), controller.get);
  router.post('/', validate(createArrendatarioSchema), controller.create);
  router.put('/:id', validate(idParamSchema, 'params'), validate(updateArrendatarioSchema), controller.update);
  router.delete('/:id', validate(idParamSchema, 'params'), controller.delete);

  return router;
}