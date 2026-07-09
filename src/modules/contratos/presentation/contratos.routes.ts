import { Router } from 'express';

import { prisma } from '../../../config/database.js';
import { authMiddleware } from '../../../shared/middleware/authMiddleware.js';
import { validate } from '../../../shared/middleware/validate.js';

import {
  AddClausulaUseCase,
  AddDocumentoUseCase,
  AddEnvioFirmaUseCase,
  AddFirmaUseCase,
  CreateContratoUseCase,
  DeleteContratoUseCase,
  GetContratoUseCase,
  GetCurrentContratoByDepartamentoUseCase,
  ListContratosUseCase,
  RemoveClausulaUseCase,
  RemoveDocumentoUseCase,
  RemoveEnvioFirmaUseCase,
  RemoveFirmaUseCase,
  RenovarContratoUseCase,
  UpdateClausulaUseCase,
  UpdateContratoUseCase,
  UpdateFirmaEstadoUseCase,
} from '../application/ContratoUseCases.js';
import { PrismaContratoRepository } from '../infrastructure/PrismaContratoRepository.js';

import { ContratoController } from './ContratoController.js';
import {
  clausulaSchema,
  createContratoSchema,
  documentoContratoSchema,
  envioFirmaSchema,
  firmaSchema,
  listContratosQuerySchema,
  renovarContratoSchema,
  updateClausulaSchema,
  updateContratoSchema,
  updateFirmaEstadoSchema,
  uuidParam,
} from './contratoValidators.js';

export function createContratosRouter(): Router {
  const router = Router();
  router.use(authMiddleware);

  const repository = new PrismaContratoRepository(prisma);

  const controller = new ContratoController(
    new ListContratosUseCase(repository),
    new GetContratoUseCase(repository),
    new GetCurrentContratoByDepartamentoUseCase(repository),
    new CreateContratoUseCase(repository),
    new UpdateContratoUseCase(repository),
    new RenovarContratoUseCase(repository),
    new DeleteContratoUseCase(repository),
    new AddClausulaUseCase(repository),
    new UpdateClausulaUseCase(repository),
    new RemoveClausulaUseCase(repository),
    new AddFirmaUseCase(repository),
    new UpdateFirmaEstadoUseCase(repository),
    new RemoveFirmaUseCase(repository),
    new AddEnvioFirmaUseCase(repository),
    new RemoveEnvioFirmaUseCase(repository),
    new AddDocumentoUseCase(repository),
    new RemoveDocumentoUseCase(repository),
  );

  // Contratos
  router.get('/', validate(listContratosQuerySchema, 'query'), controller.list);
  router.get('/departamento/:departamentoId/vigente', validate(uuidParam, 'params'), controller.getCurrentByDepartamento);
  router.get('/:id', validate(uuidParam, 'params'), controller.get);
  router.post('/', validate(createContratoSchema), controller.create);
  router.put('/:id', validate(uuidParam, 'params'), validate(updateContratoSchema), controller.update);
  router.post('/:id/renovar', validate(uuidParam, 'params'), validate(renovarContratoSchema), controller.renovar);
  router.delete('/:id', validate(uuidParam, 'params'), controller.delete);

  // Cláusulas
  router.post('/:id/clausulas', validate(uuidParam, 'params'), validate(clausulaSchema), controller.addClausula);
  router.put('/:id/clausulas/:clausulaId', validate(updateClausulaSchema), controller.updateClausula);
  router.delete('/:id/clausulas/:clausulaId', controller.removeClausula);

  // Firmas
  router.post('/:id/firmas', validate(uuidParam, 'params'), validate(firmaSchema), controller.addFirma);
  router.put('/:id/firmas/:firmaId', validate(updateFirmaEstadoSchema), controller.updateFirmaEstado);
  router.delete('/:id/firmas/:firmaId', controller.removeFirma);

  // Envíos de firma
  router.post('/:id/envios', validate(uuidParam, 'params'), validate(envioFirmaSchema), controller.addEnvio);
  router.delete('/:id/envios/:envioId', controller.removeEnvio);

  // Documentos
  router.post('/:id/documentos', validate(uuidParam, 'params'), validate(documentoContratoSchema), controller.addDocumento);
  router.delete('/:id/documentos/:documentoId', controller.removeDocumento);

  return router;
}