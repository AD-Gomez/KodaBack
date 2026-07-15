import type { Request, Response } from 'express';
import { Router } from 'express';
import { z } from 'zod';

import { prisma } from '../../config/database.js';
import { cedulaUpload } from '../../shared/middleware/cedulaUpload.js';
import { validate } from '../../shared/middleware/validate.js';
import { asyncHandler } from '../../shared/utils/asyncHandler.js';
import { logger } from '../../shared/logger.js';

import {
  EnsureEnvioPdfUseCase,
  FirmarEnvioUseCase,
  GetEnvioFirmaByTokenUseCase,
  UploadCedulaEnvioUseCase,
} from '../contratos/application/ContratoUseCases.js';
import { PrismaContratoRepository } from '../contratos/infrastructure/PrismaContratoRepository.js';

const publicRepo = new PrismaContratoRepository(prisma);

const getEnvioUseCase = new GetEnvioFirmaByTokenUseCase(publicRepo);
const firmarEnvioUseCase = new FirmarEnvioUseCase(publicRepo);
const uploadCedulaUseCase = new UploadCedulaEnvioUseCase(publicRepo);
const ensurePdfUseCase = new EnsureEnvioPdfUseCase(publicRepo);

const firmaPublicaSchema = z.object({
  nombreLegal: z.string().trim().min(3).max(160),
  firma: z
    .string()
    .max(500_000)
    .regex(/^data:image\/png;base64,[A-Za-z0-9+/]+=*$/),
});

type FirmaPublicaInput = z.infer<typeof firmaPublicaSchema>;

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
            nombreLegal: envio.nombreLegal,
            firmaData: envio.firmaData,
            cedulaFrenteUrl: envio.cedulaFrenteUrl,
            cedulaReversoUrl: envio.cedulaReversoUrl,
            pdfUrl: envio.pdfUrl,
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
    '/firmas/:token/cedula',
    cedulaUpload.fields([
      { name: 'frente', maxCount: 1 },
      { name: 'reverso', maxCount: 1 },
    ]),
    asyncHandler(async (req: Request, res: Response) => {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
      const frente = files?.frente?.[0];
      const reverso = files?.reverso?.[0];

      try {
        const envio = await uploadCedulaUseCase.execute(req.params.token!, {
          frente,
          reverso,
        });
        res.json({
          success: true,
          data: {
            id: envio.id,
            cedulaFrenteUrl: envio.cedulaFrenteUrl,
            cedulaReversoUrl: envio.cedulaReversoUrl,
          },
        });
      } catch (err) {
        logger.error({ err, token: req.params.token }, 'Error subiendo cédula');
        throw err;
      }
    }),
  );

  router.post(
    '/firmas/:token/firmar',
    validate(firmaPublicaSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const input = req.body as FirmaPublicaInput;
      const envio = await firmarEnvioUseCase.execute(req.params.token!, {
        nombreLegal: input.nombreLegal,
        firmaData: input.firma,
      });
      res.json({
        success: true,
        data: {
          id: envio.id,
          estado: envio.estado,
          fechaFirmado: envio.fechaFirmado,
          nombreLegal: envio.nombreLegal,
          cedulaFrenteUrl: envio.cedulaFrenteUrl,
          cedulaReversoUrl: envio.cedulaReversoUrl,
        },
      });
    }),
  );

  router.post(
    '/firmas/:token/pdf',
    asyncHandler(async (req: Request, res: Response) => {
      const result = await ensurePdfUseCase.execute(req.params.token!);
      res.json({
        success: true,
        data: {
          pdfUrl: result.pdfUrl,
          generated: result.generated,
        },
      });
    }),
  );

  return router;
}