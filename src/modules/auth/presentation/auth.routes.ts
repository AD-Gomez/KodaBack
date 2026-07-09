import { Router } from 'express';

import { prisma } from '../../../config/database.js';
import { authMiddleware, requireRoles } from '../../../shared/middleware/authMiddleware.js';
import { authRateLimiter } from '../../../shared/middleware/rateLimiter.js';
import { validate } from '../../../shared/middleware/validate.js';

import { GetMeUseCase } from '../application/GetMeUseCase.js';
import { LoginUseCase } from '../application/LoginUseCase.js';
import { LogoutUseCase } from '../application/LogoutUseCase.js';
import {
  DeleteUserUseCase,
  ListUsersUseCase,
  UpdateUserUseCase,
} from '../application/ManageUsersUseCases.js';
import { RefreshTokenUseCase } from '../application/RefreshTokenUseCase.js';
import { RegisterUserUseCase } from '../application/RegisterUserUseCase.js';
import { PrismaRefreshTokenRepository } from '../infrastructure/PrismaRefreshTokenRepository.js';
import { PrismaUserRepository } from '../infrastructure/PrismaUserRepository.js';

import { AuthController } from './AuthController.js';
import {
  idParamSchema,
  listUsersQuerySchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  updateUserSchema,
} from './authValidators.js';

export function createAuthRouter(): Router {
  const router = Router();

  const userRepository = new PrismaUserRepository(prisma);
  const refreshRepository = new PrismaRefreshTokenRepository(prisma);

  const loginUseCase = new LoginUseCase(userRepository, refreshRepository);
  const refreshUseCase = new RefreshTokenUseCase(userRepository, refreshRepository);
  const logoutUseCase = new LogoutUseCase(refreshRepository);
  const getMeUseCase = new GetMeUseCase(userRepository);
  const registerUseCase = new RegisterUserUseCase(userRepository);
  const listUsersUseCase = new ListUsersUseCase(userRepository);
  const updateUserUseCase = new UpdateUserUseCase(userRepository);
  const deleteUserUseCase = new DeleteUserUseCase(userRepository);

  const controller = new AuthController(
    loginUseCase,
    refreshUseCase,
    logoutUseCase,
    getMeUseCase,
    registerUseCase,
    listUsersUseCase,
    updateUserUseCase,
    deleteUserUseCase,
  );

  // ============ Rutas públicas ============
  router.post('/login', authRateLimiter, validate(loginSchema), controller.login);
  router.post('/refresh', validate(refreshSchema), controller.refresh);

  // ============ Rutas autenticadas (cualquier rol) ============
  router.post('/logout', authMiddleware, controller.logout);
  router.get('/me', authMiddleware, controller.me);

  // ============ Gestión de usuarios (solo ADMIN) ============
  router.post(
    '/users',
    authMiddleware,
    requireRoles('ADMIN'),
    validate(registerSchema),
    controller.register,
  );
  router.get(
    '/users',
    authMiddleware,
    requireRoles('ADMIN'),
    validate(listUsersQuerySchema, 'query'),
    controller.listUsers,
  );
  router.put(
    '/users/:id',
    authMiddleware,
    requireRoles('ADMIN'),
    validate(idParamSchema, 'params'),
    validate(updateUserSchema),
    controller.updateUser,
  );
  router.delete(
    '/users/:id',
    authMiddleware,
    requireRoles('ADMIN'),
    validate(idParamSchema, 'params'),
    controller.deleteUser,
  );

  return router;
}