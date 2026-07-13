import type { Request, Response } from 'express';
import { Router } from 'express';

import { prisma } from '../../config/database.js';
import { FirmarEnvioUseCase, GetEnvioFirmaByTokenUseCase } from '../contratos/application/ContratoUseCases.js';
import { PrismaContratoRepository } from '../contratos/infrastructure/PrismaContratoRepository.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';

const publicRepo = new PrismaContratoRepository(prisma);

const getEnvioUseCase = new GetEnvioFirmaByTokenUseCase(publicRepo);
const firmarEnvioUseCase = new FirmarEnvioUseCase(publicRepo);

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function createFirmasPublicRouter(): Router {
  const router = Router();

  router.get(
    '/firmas/:token',
    asyncHandler(async (req: Request, res: Response) => {
      const { envio, contrato } = await getEnvioUseCase.execute(req.params.token!);

      res.json({
        success: true,
        data: {
          envio: {
            id: envio.id,
            nombre: envio.nombre,
            email: envio.email,
            estado: envio.estado,
            fechaEnvio: envio.fechaEnvio,
            fechaFirmado: envio.fechaFirmado,
          },
          contrato: {
            id: contrato.id,
            titulo: contrato.titulo,
            version: contrato.version,
            fechaInicio: formatDate(contrato.fechaInicio),
            fechaFin: formatDate(contrato.fechaFin),
            contenido: contrato.contenido,
            departamento: contrato.departamento,
            arrendatario: contrato.arrendatario,
          },
        },
      });
    }),
  );

  router.post(
    '/firmas/:token/firmar',
    asyncHandler(async (req: Request, res: Response) => {
      const envio = await firmarEnvioUseCase.execute(req.params.token!);
      res.json({
        success: true,
        data: {
          id: envio.id,
          estado: envio.estado,
          fechaFirmado: envio.fechaFirmado,
        },
      });
    }),
  );

  return router;
}