import type { Request, Response } from 'express';

import { env } from '../../../config/env.js';
import { NotFoundError } from '../../../shared/errors/index.js';
import { asyncHandler } from '../../../shared/utils/asyncHandler.js';
import { paginate } from '../../../shared/utils/pagination.js';

import { GetMeUseCase } from '../application/GetMeUseCase.js';
import { LoginUseCase } from '../application/LoginUseCase.js';
import { LogoutUseCase } from '../application/LogoutUseCase.js';
import { RefreshTokenUseCase } from '../application/RefreshTokenUseCase.js';
import {
  DeleteUserUseCase,
  ListUsersUseCase,
  UpdateUserUseCase,
} from '../application/ManageUsersUseCases.js';
import { RegisterUserUseCase } from '../application/RegisterUserUseCase.js';
import type {
  ListUsersQuery,
  LoginDto,
  RefreshDto,
  RegisterDto,
  UpdateUserDto,
} from './authValidators.js';

export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly getMeUseCase: GetMeUseCase,
    private readonly registerUseCase: RegisterUserUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
  ) {}

  login = asyncHandler(async (req: Request, res: Response) => {
    const dto = req.body as LoginDto;
    const tokens = await this.loginUseCase.execute(dto);
    res.status(200).json({ success: true, data: tokens });
  });

  demoUsers = asyncHandler(async (_req: Request, res: Response) => {
    if (env.NODE_ENV === 'production') {
      res.status(404).json({ success: false, error: 'Not found' });
      return;
    }
    const { prisma } = await import('../../../config/database.js');
    const users = await prisma.usuario.findMany({
      where: { email: { endsWith: '@kodahouse.com' } },
      select: { email: true, nombre: true, rol: true },
      orderBy: { rol: 'asc' },
    });
    res.json({
      success: true,
      data: {
        users,
        password: env.DEMO_PASSWORD,
      },
    });
  });

  refresh = asyncHandler(async (req: Request, res: Response) => {
    const dto = req.body as RefreshDto;
    const tokens = await this.refreshUseCase.execute(dto.refreshToken);
    res.status(200).json({ success: true, data: tokens });
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.body?.refreshToken as string | undefined;
    await this.logoutUseCase.execute(refreshToken, req.user!.id);
    res.status(204).send();
  });

  me = asyncHandler(async (req: Request, res: Response) => {
    const user = await this.getMeUseCase.execute(req.user!.id);
    res.status(200).json({ success: true, data: user });
  });

  register = asyncHandler(async (req: Request, res: Response) => {
    const dto = req.body as RegisterDto;
    const user = await this.registerUseCase.execute(dto);
    res.status(201).json({ success: true, data: user });
  });

  listUsers = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as ListUsersQuery;
    const { data, total } = await this.listUsersUseCase.execute({
      page: query.page,
      limit: query.limit,
      search: query.search,
    });
    res.json({
      success: true,
      ...paginate(data, total, { page: query.page, limit: query.limit }),
    });
  });

  updateUser = asyncHandler(async (req: Request, res: Response) => {
    try {
      const user = await this.updateUserUseCase.execute(req.params.id!, req.body as UpdateUserDto);
      res.json({ success: true, data: user });
    } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new NotFoundError('Usuario');
    }
  });

  deleteUser = asyncHandler(async (req: Request, res: Response) => {
    try {
      await this.deleteUserUseCase.execute(req.params.id!);
      res.status(204).send();
    } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new NotFoundError('Usuario');
    }
  });
}