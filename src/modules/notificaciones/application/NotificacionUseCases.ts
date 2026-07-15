import { NotFoundError } from '../../../shared/errors/index.js';

import type { NotificacionRepository } from '../domain/NotificacionRepository.js';

export interface ContractSignedNotificationInput {
  usuarioId: string;
  envioId: string;
  contratoId: string;
  contratoTitulo?: string | null;
  departamentoNombre?: string;
  firmanteNombre: string;
}

export class ListNotificacionesUseCase {
  constructor(private readonly repository: NotificacionRepository) {}

  async execute(usuarioId: string) {
    return this.repository.findByUsuario(usuarioId, 50);
  }
}

export class MarkNotificacionAsReadUseCase {
  constructor(private readonly repository: NotificacionRepository) {}

  async execute(id: string, usuarioId: string) {
    const notification = await this.repository.markAsRead(id, usuarioId);
    if (!notification) throw new NotFoundError('Notificación');
    return notification;
  }
}

export class MarkAllNotificacionesAsReadUseCase {
  constructor(private readonly repository: NotificacionRepository) {}

  async execute(usuarioId: string) {
    return this.repository.markAllAsRead(usuarioId);
  }
}

export class NotifyContractSignedUseCase {
  constructor(private readonly repository: NotificacionRepository) {}

  async notifyContractSigned(input: ContractSignedNotificationInput): Promise<void> {
    const contractName =
      input.contratoTitulo?.trim() || `Contrato de ${input.departamentoNombre || 'arrendamiento'}`;
    const location = input.departamentoNombre ? ` de ${input.departamentoNombre}` : '';

    await this.repository.upsert({
      usuarioId: input.usuarioId,
      tipo: 'CONTRATO_FIRMADO',
      titulo: 'Contrato firmado',
      descripcion: `${input.firmanteNombre} firmó ${contractName}${location}.`,
      enlace: `/firmas?contrato=${input.contratoId}`,
      clave: `CONTRATO_FIRMADO:${input.envioId}`,
    });
  }
}
