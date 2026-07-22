ALTER TABLE "notificaciones"
ADD COLUMN IF NOT EXISTS "correo_enviado_at" TIMESTAMP(3);
