import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../../../config/database.js';
import { authMiddleware, requireRoles } from '../../../shared/middleware/authMiddleware.js';
import { validate } from '../../../shared/middleware/validate.js';
import { asyncHandler } from '../../../shared/utils/asyncHandler.js';

const plantillaContratoSchema = z.object({
  titulo: z.string().trim().min(3).max(160),
  contenido: z.string().max(20000),
  clausulas: z.array(z.string().trim().min(1).max(5000)).max(50),
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

  router.put('/contrato', requireRoles('ADMIN'), validate(plantillaContratoSchema), asyncHandler(async (req, res) => {
    const plantilla = await prisma.plantillaContrato.upsert({
      where: { id: PLANTILLA_ID },
      create: { id: PLANTILLA_ID, ...req.body },
      update: req.body,
    });
    res.json({ success: true, data: plantilla });
  }));

  return router;
}
