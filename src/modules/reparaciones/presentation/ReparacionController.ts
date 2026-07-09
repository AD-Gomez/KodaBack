import type { Request, Response } from 'express';

import { NotFoundError } from '../../../shared/errors/index.js';
import { asyncHandler } from '../../../shared/utils/asyncHandler.js';
import { paginate } from '../../../shared/utils/pagination.js';

import {
  CreateReparacionUseCase,
  CreateServicioUseCase,
  DeleteReparacionUseCase,
  DeleteServicioUseCase,
  GetReparacionStatsUseCase,
  GetReparacionUseCase,
  GetServicioUseCase,
  ListReparacionesUseCase,
  ListServiciosUseCase,
  UpdateReparacionUseCase,
  UpdateServicioUseCase,
} from '../application/ReparacionUseCases.js';
import type {
  CreateReparacionDto,
  CreateServicioDto,
  ListReparacionesQuery,
  ListServiciosQuery,
  UpdateReparacionDto,
  UpdateServicioDto,
} from './reparacionValidators.js';

export class ReparacionController {
  constructor(
    private readonly listUseCase: ListReparacionesUseCase,
    private readonly getUseCase: GetReparacionUseCase,
    private readonly createUseCase: CreateReparacionUseCase,
    private readonly updateUseCase: UpdateReparacionUseCase,
    private readonly deleteUseCase: DeleteReparacionUseCase,
    private readonly statsUseCase: GetReparacionStatsUseCase,
    private readonly listServUseCase: ListServiciosUseCase,
    private readonly getServUseCase: GetServicioUseCase,
    private readonly createServUseCase: CreateServicioUseCase,
    private readonly updateServUseCase: UpdateServicioUseCase,
    private readonly deleteServUseCase: DeleteServicioUseCase,
  ) {}

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
}