import type { PrismaClient } from '@prisma/client';

import { env } from '../../../config/env.js';
import type { EmailService } from '../../../shared/email/EmailService.js';
import { emailService } from '../../../shared/email/BrevoEmailService.js';
import { buildContractExpirationEmail } from '../../../shared/email/templates/contractExpirationEmail.js';
import { logger } from '../../../shared/logger.js';

const DEFAULT_REMINDER_DAYS = 15;
const CONFIGURACION_SISTEMA_ID = 'principal';
const REMINDER_INTERVAL_MS = 60 * 60 * 1000;

type ReminderContract = {
  id: string;
  titulo: string | null;
  fechaFin: Date;
  departamento: { nombre: string };
  arrendatario: { nombre: string };
};

type Administrator = {
  id: string;
  nombre: string;
  email: string;
};

function getReminderWindow(now: Date, reminderDays: number): { start: Date; end: Date } {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() + reminderDays);

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

export class ContractExpirationReminderService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly email: EmailService = emailService,
  ) {}

  async run(now = new Date()): Promise<{ contractsProcessed: number; emailsSent: number }> {
    const settings = await this.prisma.configuracionSistema.findUnique({
      where: { id: CONFIGURACION_SISTEMA_ID },
      select: { diasAvisoVencimiento: true },
    });
    const reminderDays = settings?.diasAvisoVencimiento ?? DEFAULT_REMINDER_DAYS;
    const { start, end } = getReminderWindow(now, reminderDays);
    const [contracts, administrators] = await Promise.all([
      this.prisma.contrato.findMany({
        where: {
          estado: 'FIRMADO',
          fechaFin: { gte: start, lt: end },
        },
        select: {
          id: true,
          titulo: true,
          fechaFin: true,
          departamento: { select: { nombre: true } },
          arrendatario: { select: { nombre: true } },
        },
      }),
      this.prisma.usuario.findMany({
        where: { rol: 'ADMIN', activo: true },
        select: { id: true, nombre: true, email: true },
      }),
    ]);

    let emailsSent = 0;
    for (const contract of contracts as ReminderContract[]) {
      try {
        emailsSent += await this.notifyAdministrators(
          contract,
          administrators as Administrator[],
          reminderDays,
        );
      } catch (err) {
        logger.error(
          { err, contratoId: contract.id },
          'No se pudo procesar el recordatorio de vigencia',
        );
      }
    }

    return { contractsProcessed: contracts.length, emailsSent };
  }

  private async notifyAdministrators(
    contract: ReminderContract,
    administrators: Administrator[],
    reminderDays: number,
  ): Promise<number> {
    const clave = `CONTRATO_VENCE_${reminderDays}_DIAS:${contract.id}`;
    const title = 'Contrato por vencer';
    const description = `El contrato de ${contract.arrendatario.nombre} en ${contract.departamento.nombre} vence en ${reminderDays} días.`;
    const enlace = `/firmas?contrato=${contract.id}`;

    // Las alertas se registran para todos los administradores antes de enviar cualquier correo.
    const notifications = await Promise.all(
      administrators.map((administrator) =>
        this.prisma.notificacion.upsert({
          where: { usuarioId_clave: { usuarioId: administrator.id, clave } },
          create: {
            usuarioId: administrator.id,
            tipo: 'CONTRATO_POR_VENCER',
            titulo: title,
            descripcion: description,
            enlace,
            clave,
          },
          update: {},
        }),
      ),
    );

    let emailsSent = 0;
    for (const [index, notification] of notifications.entries()) {
      if (notification.correoEnviadoAt) continue;

      const administrator = administrators[index];
      if (!administrator) continue;
      const email = buildContractExpirationEmail({
        administradorNombre: administrator.nombre,
        contratoTitulo: contract.titulo,
        departamentoNombre: contract.departamento.nombre,
        arrendatarioNombre: contract.arrendatario.nombre,
        fechaFin: contract.fechaFin,
        contratoId: contract.id,
        contractUrl: `${env.FRONTEND_PUBLIC_URL}/firmas?contrato=${contract.id}`,
        diasAvisoVencimiento: reminderDays,
      });

      try {
        await this.email.send({
          to: { email: administrator.email, name: administrator.nombre },
          subject: email.subject,
          html: email.html,
          text: email.text,
        });
        await this.prisma.notificacion.update({
          where: { id: notification.id },
          data: { correoEnviadoAt: new Date() },
        });
        emailsSent += 1;
      } catch (err) {
        logger.error(
          { err, contratoId: contract.id, administradorId: administrator.id },
          'No se pudo enviar el correo de vencimiento de contrato',
        );
      }
    }

    return emailsSent;
  }
}

export function startContractExpirationReminderScheduler(prisma: PrismaClient): () => void {
  const service = new ContractExpirationReminderService(prisma);
  let running = false;

  const run = async () => {
    if (running) return;
    running = true;
    try {
      const result = await service.run();
      if (result.contractsProcessed > 0) {
        logger.info(result, 'Recordatorios de vencimiento de contratos procesados');
      }
    } catch (err) {
      logger.error({ err }, 'Falló la tarea de recordatorios de vencimiento de contratos');
    } finally {
      running = false;
    }
  };

  void run();
  const interval = setInterval(() => void run(), REMINDER_INTERVAL_MS);
  interval.unref();
  return () => clearInterval(interval);
}
