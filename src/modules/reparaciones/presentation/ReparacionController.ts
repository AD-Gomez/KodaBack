import type { Request, Response } from 'express';

import { NotFoundError } from '../../../shared/errors/index.js';
import { buildReparacionPdf } from '../../../shared/pdf/reparacionPdf.js';
import { asyncHandler } from '../../../shared/utils/asyncHandler.js';
import { paginate } from '../../../shared/utils/pagination.js';

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
import type { ReparacionWithRelations } from '../domain/Reparacion.js';
import type {
  CreateReparacionDto,
  CreateServicioDto,
  ListReparacionesQuery,
  ListServiciosQuery,
  ReparacionPdfQuery,
  UpdateReparacionDto,
  UpdateServicioDto,
  UploadReparacionFotoDto,
} from './reparacionValidators.js';

export class ReparacionController {
  constructor(
    private readonly listUseCase: ListReparacionesUseCase,
    private readonly getUseCase: GetReparacionUseCase,
    private readonly createUseCase: CreateReparacionUseCase,
    private readonly updateUseCase: UpdateReparacionUseCase,
    private readonly deleteUseCase: DeleteReparacionUseCase,
    private readonly statsUseCase: GetReparacionStatsUseCase,
    private readonly addFotoUseCase: AddReparacionFotoUseCase,
    private readonly removeFotoUseCase: RemoveReparacionFotoUseCase,
    private readonly listServUseCase: ListServiciosUseCase,
    private readonly getServUseCase: GetServicioUseCase,
    private readonly createServUseCase: CreateServicioUseCase,
    private readonly updateServUseCase: UpdateServicioUseCase,
    private readonly deleteServUseCase: DeleteServicioUseCase,
  ) {}

  private async loadReparacionCompleta(id: string): Promise<ReparacionWithRelations> {
    const reparacion = await this.getUseCase.execute(id);
    return reparacion;
  }

  list = asyncHandler(async (req: Request, res: Response) => {
    const q = req.query as unknown as ListReparacionesQuery;
    const { data, total } = await this.listUseCase.execute({
      filters: {
        estado: q.estado,
        prioridad: q.prioridad,
        tipo: q.tipo,
        departamentoId: q.departamentoId,
        search: q.search,
      },
      page: q.page,
      limit: q.limit,
    });
    res.json({
      success: true,
      ...paginate(data, total, { page: q.page, limit: q.limit }),
    });
  });

  get = asyncHandler(async (req: Request, res: Response) => {
    try {
      const r = await this.getUseCase.execute(req.params.id!);
      res.json({ success: true, data: r });
    } catch {
      throw new NotFoundError('Reparación');
    }
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const r = await this.createUseCase.execute(req.body as CreateReparacionDto);
    res.status(201).json({ success: true, data: r });
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    try {
      const r = await this.updateUseCase.execute(req.params.id!, req.body as UpdateReparacionDto);
      res.json({ success: true, data: r });
    } catch {
      throw new NotFoundError('Reparación');
    }
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    try {
      await this.deleteUseCase.execute(req.params.id!);
      res.status(204).send();
    } catch {
      throw new NotFoundError('Reparación');
    }
  });

  stats = asyncHandler(async (_req: Request, res: Response) => {
    const stats = await this.statsUseCase.execute();
    res.json({ success: true, data: stats });
  });

  listServicios = asyncHandler(async (req: Request, res: Response) => {
    const q = req.query as unknown as ListServiciosQuery;
    const data = await this.listServUseCase.execute({
      estado: q.estado,
      tipo: q.tipo,
      departamentoId: q.departamentoId,
      frecuencia: q.frecuencia,
    });
    res.json({ success: true, data });
  });

  getServicio = asyncHandler(async (req: Request, res: Response) => {
    try {
      const s = await this.getServUseCase.execute(req.params.id!);
      res.json({ success: true, data: s });
    } catch {
      throw new NotFoundError('Servicio');
    }
  });

  createServicio = asyncHandler(async (req: Request, res: Response) => {
    const s = await this.createServUseCase.execute(req.body as CreateServicioDto);
    res.status(201).json({ success: true, data: s });
  });

  updateServicio = asyncHandler(async (req: Request, res: Response) => {
    try {
      const s = await this.updateServUseCase.execute(req.params.id!, req.body as UpdateServicioDto);
      res.json({ success: true, data: s });
    } catch {
      throw new NotFoundError('Servicio');
    }
  });

  deleteServicio = asyncHandler(async (req: Request, res: Response) => {
    try {
      await this.deleteServUseCase.execute(req.params.id!);
      res.status(204).send();
    } catch {
      throw new NotFoundError('Servicio');
    }
  });

  addFoto = asyncHandler(async (req: Request, res: Response) => {
    try {
      const foto = await this.addFotoUseCase.execute(req.params.id!, req.body as UploadReparacionFotoDto);
      res.status(201).json({ success: true, data: foto });
    } catch (err) {
      if (err instanceof Error && err.message === 'Reparación no encontrada') {
        throw new NotFoundError('Reparación');
      }
      throw err;
    }
  });

  removeFoto = asyncHandler(async (req: Request, res: Response) => {
    try {
      await this.removeFotoUseCase.execute(req.params.id!, req.params.fotoId!);
      res.status(204).send();
    } catch (err) {
      if (err instanceof Error && err.message === 'Foto no encontrada') {
        throw new NotFoundError('Foto');
      }
      throw err;
    }
  });

  pdf = asyncHandler(async (req: Request, res: Response) => {
    let reparacion: ReparacionWithRelations;
    try {
      reparacion = await this.loadReparacionCompleta(req.params.id!);
    } catch {
      throw new NotFoundError('Reparación');
    }
    const query = (req.query as unknown as ReparacionPdfQuery) || {};
    const buffer = await buildReparacionPdf({ reparacion });

    const slug = (reparacion.titulo || `reparacion-${reparacion.id.slice(0, 8)}`)
      .replace(/[^a-z0-9-_]+/gi, '-')
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || `reparacion-${reparacion.id.slice(0, 8)}`;

    const filename = `manifiesto-${slug}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', buffer.length.toString());

    if (query.download) {
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    } else {
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    }

    res.status(200).end(buffer);
  });
}