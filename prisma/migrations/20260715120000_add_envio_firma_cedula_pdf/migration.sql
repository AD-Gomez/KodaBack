ALTER TABLE "envios_firma"
ADD COLUMN "cedula_frente_url" TEXT,
ADD COLUMN "cedula_reverso_url" TEXT,
ADD COLUMN "pdf_url" TEXT,
ADD COLUMN "pdf_generado_at" TIMESTAMP(3);