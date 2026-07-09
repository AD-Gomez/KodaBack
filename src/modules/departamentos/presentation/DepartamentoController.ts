import type { Request, Response } from 'express';

import { NotFoundError } from '../../../shared/errors/index.js';
import { asyncHandler } from '../../../shared/utils/asyncHandler.js';
import { paginate } from '../../../shared/utils/pagination.js';

import {
  CreateDepartamentoUseCase,
  DeleteDepartamentoUseCase,
  GetDepartamentoStatsUseCase,
  GetDepartamentoUseCase,
  ListDepartamentosUseCase,
  UpdateDepartamentoUseCase,
} from '../application/DepartamentoUseCases.js';
import type {
  CreateDepartamentoDto,
  ListDepartamentosQuery,
  UpdateDepartamentoDto,
} from './departamentoValidators.js';

export class DepartamentoController {
  constructor(
    private readonly listUseCase: ListDepartamentosUseCase,
    private readonly getUseCase: GetDepartamentoUseCase,
    private readonly createUseCase: CreateDepartamentoUseCase,
    private readonly updateUseCase: UpdateDepartamentoUseCase,
    private readonly deleteUseCase: DeleteDepartamentoUseCase,
    private readonly statsUseCase: GetDepartamentoStatsUseCase,
  ) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListDepartamentosQuery;
    const { data, total } = await this.listUseCase.execute({
      filters: { estado: query.estado, search: query.search },
      page: query.page,
      limit: query.limit,
    });
    res.json({
      success: true,
      ...paginate(data, total, { page: query.page, limit: query.limit }),
    });
  });

  get = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const departamento = await this.getUseCase.execute(id);
      res.json({ success: true, data: departamento });
    } catch {
      throw new NotFoundError('Departamento');
    }
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const dto = req.body as CreateDepartamentoDto;
    const departamento = await this.createUseCase.execute(dto);
    res.status(201).json({ success: true, data: departamento });
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const dto = req.body as UpdateDepartamentoDto;
    try {
      const departamento = await this.updateUseCase.execute(id, dto);
      res.json({ success: true, data: departamento });
    } catch {
      throw new NotFoundError('Departamento');
    }
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      await this.deleteUseCase.execute(id);
      res.status(204).send();
    } catch {
      throw new NotFoundError('Departamento');
    }
  });

  stats = asyncHandler(async (_req: Request, res: Response) => {
    const stats = await this.statsUseCase.execute();
    res.json({ success: true, data: stats });
  });
}