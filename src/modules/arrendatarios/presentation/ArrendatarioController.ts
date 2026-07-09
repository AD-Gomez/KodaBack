import type { Request, Response } from 'express';

import { NotFoundError } from '../../../shared/errors/index.js';
import { asyncHandler } from '../../../shared/utils/asyncHandler.js';
import { paginate } from '../../../shared/utils/pagination.js';

import {
  CreateArrendatarioUseCase,
  DeleteArrendatarioUseCase,
  GetArrendatarioUseCase,
  ListArrendatariosUseCase,
  UpdateArrendatarioUseCase,
} from '../application/ArrendatarioUseCases.js';
import type {
  CreateArrendatarioDto,
  ListArrendatariosQuery,
  UpdateArrendatarioDto,
} from './arrendatarioValidators.js';

export class ArrendatarioController {
  constructor(
    private readonly listUseCase: ListArrendatariosUseCase,
    private readonly getUseCase: GetArrendatarioUseCase,
    private readonly createUseCase: CreateArrendatarioUseCase,
    private readonly updateUseCase: UpdateArrendatarioUseCase,
    private readonly deleteUseCase: DeleteArrendatarioUseCase,
  ) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListArrendatariosQuery;
    const { data, total } = await this.listUseCase.execute({
      filters: {
        estado: query.estado,
        departamentoId: query.departamentoId,
        search: query.search,
      },
      page: query.page,
      limit: query.limit,
    });
    res.json({
      success: true,
      ...paginate(data, total, { page: query.page, limit: query.limit }),
    });
  });

  get = asyncHandler(async (req: Request, res: Response) => {
    try {
      const arr = await this.getUseCase.execute(req.params.id!);
      res.json({ success: true, data: arr });
    } catch {
      throw new NotFoundError('Arrendatario');
    }
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const dto = req.body as CreateArrendatarioDto;
    const arr = await this.createUseCase.execute(dto);
    res.status(201).json({ success: true, data: arr });
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    const dto = req.body as UpdateArrendatarioDto;
    try {
      const arr = await this.updateUseCase.execute(req.params.id!, dto);
      res.json({ success: true, data: arr });
    } catch {
      throw new NotFoundError('Arrendatario');
    }
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    try {
      await this.deleteUseCase.execute(req.params.id!);
      res.status(204).send();
    } catch {
      throw new NotFoundError('Arrendatario');
    }
  });
}