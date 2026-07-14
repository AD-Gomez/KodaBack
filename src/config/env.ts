import { config as loadEnv } from 'dotenv';
import { z } from 'zod';
import path from 'node:path';

// Cargar .env solo fuera de tests (en tests, vitest.setup.ts se encarga)
if (process.env.NODE_ENV !== 'test') {
  loadEnv({ path: path.resolve(process.cwd(), '.env') });
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  API_PREFIX: z.string().default('/api/v1'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL es requerido'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener mínimo 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('2h'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET debe tener mínimo 32 caracteres'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(10),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  LOG_PRETTY: z.coerce.boolean().default(true),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(200),

  DEMO_PASSWORD: z.string().default('KodaHouse2024!'),

  // ============ Email (Brevo) ============
  BREVO_API_KEY: z.string().min(1, 'BREVO_API_KEY es requerido para envío de correos').optional(),
  EMAIL_FROM: z.string().email().default('legal@kodahouses.com'),
  EMAIL_FROM_NAME: z.string().min(1).default('KodaHouse · Legal'),
  FRONTEND_PUBLIC_URL: z.string().url().default('https://kodahouses.com'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Variables de entorno inválidas:');
  // eslint-disable-next-line no-console
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
