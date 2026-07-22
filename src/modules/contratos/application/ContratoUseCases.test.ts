import { describe, expect, it, vi } from 'vitest';

import { CreateContratoUseCase } from './ContratoUseCases.js';
import type { ContratoRepository } from '../domain/ContratoRepository.js';

describe('CreateContratoUseCase', () => {
  it('asigna la siguiente versión disponible para el departamento', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'contrato-nuevo' });
    const findById = vi.fn().mockResolvedValue({ id: 'contrato-nuevo', version: 3 });
    const findMany = vi.fn().mockResolvedValue([{ version: 2 }, { version: 1 }]);
    const repository = { create, findById, findMany } as unknown as ContratoRepository;
    const useCase = new CreateContratoUseCase(repository);

    await useCase.execute({
      departamentoId: 'departamento-1',
      arrendatarioId: 'arrendatario-1',
      fechaInicio: '2026-08-01',
      fechaFin: '2027-08-01',
    });

    expect(findMany).toHaveBeenCalledWith({ departamentoId: 'departamento-1' });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ version: 3 }));
  });

  it('convierte una colisión de versión en un conflicto controlado', async () => {
    const repository = {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockRejectedValue({ code: 'P2002' }),
    } as unknown as ContratoRepository;
    const useCase = new CreateContratoUseCase(repository);

    await expect(
      useCase.execute({
        departamentoId: 'departamento-1',
        arrendatarioId: 'arrendatario-1',
        fechaInicio: '2026-08-01',
        fechaFin: '2027-08-01',
      }),
    ).rejects.toMatchObject({ statusCode: 409, code: 'CONFLICT' });
  });
});
