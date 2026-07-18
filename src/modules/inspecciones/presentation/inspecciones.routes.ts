import { Router } from 'express';
import type { Request, Response } from 'express';

import { prisma } from '../../../config/database.js';
import { NotFoundError, UnauthorizedError, ValidationError } from '../../../shared/errors/index.js';
import { authMiddleware } from '../../../shared/middleware/authMiddleware.js';
import { validate } from '../../../shared/middleware/validate.js';
import { asyncHandler } from '../../../shared/utils/asyncHandler.js';

import {
  ambienteParamSchema,
  createAmbienteSchema,
  createInspeccionSchema,
  fotoParamSchema,
  inspeccionIdParamSchema,
  listInspeccionesQuerySchema,
  updateAmbienteSchema,
  updateInspeccionSchema,
  uploadFotoSchema,
  type CreateAmbienteDto,
  type CreateInspeccionDto,
  type ListInspeccionesQuery,
  type UpdateAmbienteDto,
  type UpdateInspeccionDto,
  type UploadFotoDto,
} from './inspeccionValidators.js';

const AMBIENTES_INICIALES = [
  { nombre: 'Acceso y entrada', requerido: true },
  { nombre: 'Sala y comedor', requerido: true },
  { nombre: 'Cocina', requerido: true },
  { nombre: 'Habitación principal', requerido: true },
  { nombre: 'Baño', requerido: true },
  { nombre: 'Servicios e instalaciones', requerido: true },
  { nombre: 'Detalles adicionales', requerido: false },
];

const detailInclude = {
  departamento: {
    select: { id: true, nombre: true, direccion: true, distribucion: true, estado: true },
  },
  inspector: { select: { id: true, nombre: true, email: true } },
  ambientes: {
    orderBy: { orden: 'asc' as const },
    include: { fotos: { orderBy: { createdAt: 'asc' as const } } },
  },
};

async function getInspectionOrThrow(id: string) {
  const inspeccion = await prisma.inspeccion.findUnique({ where: { id }, include: detailInclude });
  if (!inspeccion) throw new NotFoundError('Inspección');
  return inspeccion;
}

function getAuthenticatedUserId(req: Request): string {
  if (!req.user) throw new UnauthorizedError();
  return req.user.id;
}

export function createInspeccionesRouter(): Router {
  const router = Router();
  router.use(authMiddleware);

  router.get(
    '/stats',
    asyncHandler(async (_req: Request, res: Response) => {
      const [total, enCurso, completadas, conDanos] = await Promise.all([
        prisma.inspeccion.count(),
        prisma.inspeccion.count({ where: { estado: 'EN_CURSO' } }),
        prisma.inspeccion.count({ where: { estado: 'COMPLETADA' } }),
        prisma.inspeccion.count({
          where: { ambientes: { some: { condicion: 'DANO' } } },
        }),
      ]);
      res.json({ success: true, data: { total, enCurso, completadas, conDanos } });
    }),
  );

  router.get(
    '/',
    validate(listInspeccionesQuerySchema, 'query'),
    asyncHandler(async (req: Request, res: Response) => {
      const query = req.query as unknown as ListInspeccionesQuery;
      const data = await prisma.inspeccion.findMany({
        where: {
          departamentoId: query.departamentoId,
          estado: query.estado,
          tipo: query.tipo,
        },
        orderBy: { updatedAt: 'desc' },
        take: 100,
        include: {
          departamento: { select: { id: true, nombre: true, direccion: true } },
          inspector: { select: { id: true, nombre: true } },
          ambientes: {
            orderBy: { orden: 'asc' },
            select: {
              id: true,
              nombre: true,
              requerido: true,
              condicion: true,
              _count: { select: { fotos: true } },
            },
          },
        },
      });
      res.json({ success: true, data });
    }),
  );

  router.get(
    '/:id',
    validate(inspeccionIdParamSchema, 'params'),
    asyncHandler(async (req: Request, res: Response) => {
      res.json({ success: true, data: await getInspectionOrThrow(String(req.params.id)) });
    }),
  );

  router.post(
    '/',
    validate(createInspeccionSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const body = req.body as CreateInspeccionDto;
      const departamento = await prisma.departamento.findUnique({ where: { id: body.departamentoId } });
      if (!departamento) throw new NotFoundError('Departamento');

      const inspeccion = await prisma.inspeccion.create({
        data: {
          departamentoId: body.departamentoId,
          inspectorId: getAuthenticatedUserId(req),
          tipo: body.tipo,
          ambientes: {
            create: AMBIENTES_INICIALES.map((ambiente, orden) => ({ ...ambiente, orden })),
          },
        },
        include: detailInclude,
      });
      res.status(201).json({ success: true, data: inspeccion });
    }),
  );

  router.put(
    '/:id',
    validate(inspeccionIdParamSchema, 'params'),
    validate(updateInspeccionSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const body = req.body as UpdateInspeccionDto;
      const current = await getInspectionOrThrow(String(req.params.id));

      if (current.estado === 'COMPLETADA') {
        throw new ValidationError('Una inspección completada no se puede modificar');
      }

      if (body.estado === 'COMPLETADA') {
        const incompletos = current.ambientes.filter(
          (ambiente) =>
            ambiente.requerido &&
            (ambiente.condicion === 'SIN_REVISAR' || ambiente.fotos.length === 0),
        );
        if (incompletos.length > 0) {
          throw new ValidationError('Faltan ambientes por documentar', {
            ambientes: incompletos.map((ambiente) => ambiente.nombre),
          });
        }
      }

      const data = await prisma.inspeccion.update({
        where: { id: current.id },
        data: {
          estado: body.estado,
          notasGenerales: body.notasGenerales,
          completadaAt: body.estado === 'COMPLETADA' ? new Date() : undefined,
        },
        include: detailInclude,
      });
      res.json({ success: true, data });
    }),
  );

  router.post(
    '/:id/ambientes',
    validate(inspeccionIdParamSchema, 'params'),
    validate(createAmbienteSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const inspeccion = await getInspectionOrThrow(String(req.params.id));
      if (inspeccion.estado === 'COMPLETADA') {
        throw new ValidationError('Una inspección completada no se puede modificar');
      }
      const body = req.body as CreateAmbienteDto;
      const ambiente = await prisma.ambienteInspeccion.create({
        data: {
          inspeccionId: inspeccion.id,
          nombre: body.nombre,
          requerido: body.requerido,
          orden: inspeccion.ambientes.length,
        },
        include: { fotos: true },
      });
      res.status(201).json({ success: true, data: ambiente });
    }),
  );

  router.put(
    '/:id/ambientes/:ambienteId',
    validate(ambienteParamSchema, 'params'),
    validate(updateAmbienteSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const body = req.body as UpdateAmbienteDto;
      const ambiente = await prisma.ambienteInspeccion.findFirst({
        where: { id: req.params.ambienteId, inspeccionId: req.params.id },
        include: { inspeccion: { select: { estado: true } } },
      });
      if (!ambiente) throw new NotFoundError('Ambiente');
      if (ambiente.inspeccion.estado === 'COMPLETADA') {
        throw new ValidationError('Una inspección completada no se puede modificar');
      }
      const data = await prisma.ambienteInspeccion.update({
        where: { id: ambiente.id },
        data: body,
        include: { fotos: { orderBy: { createdAt: 'asc' } } },
      });
      res.json({ success: true, data });
    }),
  );

  router.delete(
    '/:id/ambientes/:ambienteId',
    validate(ambienteParamSchema, 'params'),
    asyncHandler(async (req: Request, res: Response) => {
      const ambiente = await prisma.ambienteInspeccion.findFirst({
        where: { id: req.params.ambienteId, inspeccionId: req.params.id },
        include: { inspeccion: { select: { estado: true } } },
      });
      if (!ambiente) throw new NotFoundError('Ambiente');
      if (ambiente.inspeccion.estado === 'COMPLETADA') {
        throw new ValidationError('Una inspección completada no se puede modificar');
      }
      if (ambiente.requerido) {
        throw new ValidationError('Los ambientes requeridos no se pueden eliminar');
      }
      await prisma.ambienteInspeccion.delete({ where: { id: ambiente.id } });
      res.status(204).send();
    }),
  );

  router.post(
    '/:id/ambientes/:ambienteId/fotos',
    validate(ambienteParamSchema, 'params'),
    validate(uploadFotoSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const body = req.body as UploadFotoDto;
      const ambiente = await prisma.ambienteInspeccion.findFirst({
        where: { id: req.params.ambienteId, inspeccionId: req.params.id },
        include: { inspeccion: { select: { estado: true } } },
      });
      if (!ambiente) throw new NotFoundError('Ambiente');
      if (ambiente.inspeccion.estado === 'COMPLETADA') {
        throw new ValidationError('Una inspección completada no se puede modificar');
      }
      const foto = await prisma.fotoInspeccion.create({
        data: {
          ambienteId: ambiente.id,
          nombreArchivo: body.nombreArchivo,
          mimeType: body.mimeType,
          datos: body.datos,
          observacion: body.observacion,
        },
      });
      res.status(201).json({ success: true, data: foto });
    }),
  );

  router.delete(
    '/:id/fotos/:fotoId',
    validate(fotoParamSchema, 'params'),
    asyncHandler(async (req: Request, res: Response) => {
      const foto = await prisma.fotoInspeccion.findFirst({
        where: { id: req.params.fotoId, ambiente: { inspeccionId: req.params.id } },
        include: { ambiente: { include: { inspeccion: { select: { estado: true } } } } },
      });
      if (!foto) throw new NotFoundError('Foto');
      if (foto.ambiente.inspeccion.estado === 'COMPLETADA') {
        throw new ValidationError('Una inspección completada no se puede modificar');
      }
      await prisma.fotoInspeccion.delete({ where: { id: foto.id } });
      res.status(204).send();
    }),
  );

  return router;
}
