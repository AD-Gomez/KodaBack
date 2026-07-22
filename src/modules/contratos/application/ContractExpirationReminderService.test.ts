import { describe, expect, it, vi } from 'vitest';

import { ContractExpirationReminderService } from './ContractExpirationReminderService.js';
import type { PrismaClient } from '@prisma/client';
import type { EmailService } from '../../../shared/email/EmailService.js';

const now = new Date('2026-07-06T14:00:00.000Z');

function createPrisma(correoEnviadoAt: Date | null = null, diasAvisoVencimiento: number | null = null) {
  const events: string[] = [];
  const prisma = {
    configuracionSistema: {
      findUnique: vi
        .fn()
        .mockResolvedValue(
          diasAvisoVencimiento === null ? null : { diasAvisoVencimiento },
        ),
    },
    contrato: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: 'contrato-1',
          titulo: 'Contrato Adriana 2B',
          fechaFin: new Date('2026-07-21T00:00:00.000Z'),
          departamento: { nombre: 'Adriana 2B' },
          arrendatario: { nombre: 'Winda Febres' },
        },
      ]),
    },
    usuario: {
      findMany: vi.fn().mockResolvedValue([
        { id: 'admin-1', nombre: 'Admin Uno', email: 'uno@example.com' },
        { id: 'admin-2', nombre: 'Admin Dos', email: 'dos@example.com' },
      ]),
    },
    notificacion: {
      upsert: vi.fn(async ({ create }) => {
        events.push(`notificacion:${create.usuarioId}`);
        return { id: `notificacion-${create.usuarioId}`, correoEnviadoAt };
      }),
      update: vi.fn(async ({ where }) => {
        events.push(`correo-marcado:${where.id}`);
        return {};
      }),
    },
  };
  return { prisma, events };
}

describe('ContractExpirationReminderService', () => {
  it('notifica a todos los administradores antes de enviar los correos', async () => {
    const { prisma, events } = createPrisma();
    const email: EmailService = {
      send: vi.fn(async ({ to }) => {
        events.push(`correo:${to.email}`);
        return { messageId: 'message-1' };
      }),
    };
    const service = new ContractExpirationReminderService(prisma as unknown as PrismaClient, email);

    const result = await service.run(now);

    expect(result).toEqual({ contractsProcessed: 1, emailsSent: 2 });
    expect(prisma.contrato.findMany).toHaveBeenCalledWith({
      where: {
        estado: 'FIRMADO',
        fechaFin: {
          gte: new Date('2026-07-21T00:00:00.000Z'),
          lt: new Date('2026-07-22T00:00:00.000Z'),
        },
      },
      select: {
        id: true,
        titulo: true,
        fechaFin: true,
        departamento: { select: { nombre: true } },
        arrendatario: { select: { nombre: true } },
      },
    });
    expect(events.slice(0, 2)).toEqual(['notificacion:admin-1', 'notificacion:admin-2']);
    expect(events).toContain('correo:uno@example.com');
    expect(events).toContain('correo:dos@example.com');
  });

  it('no reenvía un correo que ya quedó registrado', async () => {
    const { prisma } = createPrisma(new Date('2026-07-06T14:00:00.000Z'));
    const email: EmailService = { send: vi.fn() };
    const service = new ContractExpirationReminderService(prisma as unknown as PrismaClient, email);

    const result = await service.run(now);

    expect(result).toEqual({ contractsProcessed: 1, emailsSent: 0 });
    expect(email.send).not.toHaveBeenCalled();
    expect(prisma.notificacion.update).not.toHaveBeenCalled();
  });

  it('usa los días configurados por el administrador', async () => {
    const { prisma } = createPrisma(null, 30);
    const email: EmailService = { send: vi.fn().mockResolvedValue({ messageId: 'message-1' }) };
    const service = new ContractExpirationReminderService(
      prisma as unknown as PrismaClient,
      email,
    );

    await service.run(now);

    expect(prisma.contrato.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          estado: 'FIRMADO',
          fechaFin: {
            gte: new Date('2026-08-05T00:00:00.000Z'),
            lt: new Date('2026-08-06T00:00:00.000Z'),
          },
        },
      }),
    );
    expect(prisma.notificacion.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          usuarioId_clave: {
            usuarioId: 'admin-1',
            clave: 'CONTRATO_VENCE_30_DIAS:contrato-1',
          },
        },
      }),
    );
  });
});
