import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase, prisma } from './config/database.js';
import { startContractExpirationReminderScheduler } from './modules/contratos/application/ContractExpirationReminderService.js';
import { createApp } from './app.js';
import { logger } from './shared/logger.js';

async function bootstrap(): Promise<void> {
  await connectDatabase();
  const stopContractExpirationReminders = startContractExpirationReminderScheduler(prisma);

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 KodaBack corriendo en http://localhost:${env.PORT}${env.API_PREFIX}`);
    logger.info(`📊 Health check: http://localhost:${env.PORT}/health`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Cerrando servidor...');
    server.close(async () => {
      stopContractExpirationReminders();
      await disconnectDatabase();
      logger.info('Servidor cerrado correctamente');
      process.exit(0);
    });

    // Forzar cierre después de 10s
    setTimeout(() => {
      logger.error('Cierre forzado por timeout');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught Exception');
    process.exit(1);
  });
  process.on('unhandledRejection', (reason) => {
    logger.fatal({ reason }, 'Unhandled Rejection');
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  logger.fatal({ err }, 'Error fatal al iniciar el servidor');
  process.exit(1);
});
