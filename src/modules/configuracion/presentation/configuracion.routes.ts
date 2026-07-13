import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import { prisma } from '../../../config/database.js';
import { authMiddleware, requireRoles } from '../../../shared/middleware/authMiddleware.js';
import { validate } from '../../../shared/middleware/validate.js';
import { asyncHandler } from '../../../shared/utils/asyncHandler.js';
import { sanitizeRichText } from '../../../shared/utils/sanitizeRichText.js';

const plantillaContratoSchema = z.object({
  titulo: z.string().trim().min(3).max(160),
  contenido: z.string().max(20000),
  clausulas: z.array(z.string().trim().min(1).max(5000)).max(50),
});

const plantillaIdSchema = z.object({
  id: z.string().trim().min(1).max(100),
});

const PLANTILLA_ID = 'principal';
const plantillaPorDefecto = {
  id: PLANTILLA_ID,
  titulo: 'Contrato de arrendamiento',
  contenido: '',
  clausulas: [],
};

export function createConfiguracionRouter(): Router {
  const router = Router();
  router.use(authMiddleware);

  router.get('/contrato', asyncHandler(async (_req, res) => {
    const plantilla = await prisma.plantillaContrato.findUnique({ where: { id: PLANTILLA_ID } });
    res.json({ success: true, data: plantilla ?? plantillaPorDefecto });
  }));

  router.get('/contratos', asyncHandler(async (_req, res) => {
    const plantillas = await prisma.plantillaContrato.findMany({
      orderBy: [{ id: 'asc' }, { updatedAt: 'desc' }],
    });
    res.json({ success: true, data: plantillas.length ? plantillas : [plantillaPorDefecto] });
  }));

  router.put('/contrato', requireRoles('ADMIN'), validate(plantillaContratoSchema), asyncHandler(async (req, res) => {
    const data = { ...req.body, contenido: sanitizeRichText(req.body.contenido) };
    const plantilla = await prisma.plantillaContrato.upsert({
      where: { id: PLANTILLA_ID },
      create: { id: PLANTILLA_ID, ...data },
      update: data,
    });
    res.json({ success: true, data: plantilla });
  }));

  router.post('/contratos', requireRoles('ADMIN'), validate(plantillaContratoSchema), asyncHandler(async (req, res) => {
    const plantilla = await prisma.plantillaContrato.create({
      data: {
        id: randomUUID(),
        ...req.body,
        contenido: sanitizeRichText(req.body.contenido),
      },
    });
    res.status(201).json({ success: true, data: plantilla });
  }));

  router.put('/contratos/:id', requireRoles('ADMIN'), validate(plantillaIdSchema, 'params'), validate(plantillaContratoSchema), asyncHandler(async (req, res) => {
    const data = {
      ...req.body,
      contenido: sanitizeRichText(req.body.contenido),
    };
    const plantilla = await prisma.plantillaContrato.upsert({
      where: { id: req.params.id },
      create: { id: req.params.id, ...data },
      update: data,
    });
    res.json({ success: true, data: plantilla });
  }));

  router.delete('/contratos/:id', requireRoles('ADMIN'), validate(plantillaIdSchema, 'params'), asyncHandler(async (req, res) => {
    await prisma.plantillaContrato.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }));

  return router;
}
