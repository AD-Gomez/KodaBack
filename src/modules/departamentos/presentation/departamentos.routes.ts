import { Router } from 'express';

import { prisma } from '../../../config/database.js';
import { authMiddleware } from '../../../shared/middleware/authMiddleware.js';
import { validate } from '../../../shared/middleware/validate.js';

import {
  CreateDepartamentoUseCase,
  DeleteDepartamentoUseCase,
  GetDepartamentoStatsUseCase,
  GetDepartamentoUseCase,
  ListDepartamentosUseCase,
  UpdateDepartamentoUseCase,
} from '../application/DepartamentoUseCases.js';
import { PrismaDepartamentoRepository } from '../infrastructure/PrismaDepartamentoRepository.js';

import { DepartamentoController } from './DepartamentoController.js';
import {
  createDepartamentoSchema,
  idParamSchema,
  listDepartamentosQuerySchema,
  updateDepartamentoSchema,
} from './departamentoValidators.js';

export function createDepartamentosRouter(): Router {
  const router = Router();
  router.use(authMiddleware);

  const repository = new PrismaDepartamentoRepository(prisma);
  const listUseCase = new ListDepartamentosUseCase(repository);
  const getUseCase = new GetDepartamentoUseCase(repository);
  const createUseCase = new CreateDepartamentoUseCase(repository);
  const updateUseCase = new UpdateDepartamentoUseCase(repository);
  const deleteUseCase = new DeleteDepartamentoUseCase(repository);
  const statsUseCase = new GetDepartamentoStatsUseCase(repository);

  const controller = new DepartamentoController(
    listUseCase,
    getUseCase,
    createUseCase,
    updateUseCase,
    deleteUseCase,
    statsUseCase,
  );

  router.get('/stats', controller.stats);
  router.get('/', validate(listDepartamentosQuerySchema, 'query'), controller.list);
  router.get('/:id', validate(idParamSchema, 'params'), controller.get);
  router.post('/', validate(createDepartamentoSchema), controller.create);
  router.put('/:id', validate(idParamSchema, 'params'), validate(updateDepartamentoSchema), controller.update);
  router.delete('/:id', validate(idParamSchema, 'params'), controller.delete);

  return router;
}