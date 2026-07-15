import { describe, expect, it, vi } from 'vitest';

import { NotifyContractSignedUseCase } from './NotificacionUseCases.js';
import type { NotificacionRepository } from '../domain/NotificacionRepository.js';

const createRepository = () => ({
  findByUsuario: vi.fn(),
  upsert: vi.fn().mockResolvedValue({}),
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
});

describe('NotifyContractSignedUseCase', () => {
  it('crea una notificación para el creador del contrato', async () => {
    const repository = createRepository();
    const useCase = new NotifyContractSignedUseCase(
      repository as unknown as NotificacionRepository,
    );

    await useCase.notifyContractSigned({
      usuarioId: 'usuario-1',
      envioId: 'envio-1',
      contratoId: 'contrato-1',
      contratoTitulo: 'Contrato de arrendamiento',
      departamentoNombre: 'Departamento 101',
      firmanteNombre: 'Ana Pérez',
    });

    expect(repository.upsert).toHaveBeenCalledWith({
      usuarioId: 'usuario-1',
      tipo: 'CONTRATO_FIRMADO',
      titulo: 'Contrato firmado',
      descripcion: 'Ana Pérez firmó Contrato de arrendamiento de Departamento 101.',
      enlace: '/firmas?contrato=contrato-1',
      clave: 'CONTRATO_FIRMADO:envio-1',
    });
  });
});
