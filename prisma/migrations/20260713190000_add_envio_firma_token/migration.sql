-- AlterTable: add token (uuid) and fecha_firmado to envios_firma
ALTER TABLE "envios_firma" ADD COLUMN "token" TEXT;
ALTER TABLE "envios_firma" ADD COLUMN "fecha_firmado" TIMESTAMP(3);

-- Backfill existing rows with random tokens so the UNIQUE constraint can be built safely
UPDATE "envios_firma" SET "token" = gen_random_uuid()::text WHERE "token" IS NULL;

-- Enforce NOT NULL + UNIQUE
ALTER TABLE "envios_firma" ALTER COLUMN "token" SET NOT NULL;
CREATE UNIQUE INDEX "envios_firma_token_key" ON "envios_firma"("token");
CREATE INDEX "envios_firma_token_idx" ON "envios_firma"("token");