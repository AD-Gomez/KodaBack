ALTER TABLE "contratos"
  ADD COLUMN "titulo" TEXT,
  ADD COLUMN "contenido" TEXT;

CREATE TABLE "plantillas_contrato" (
  "id" TEXT NOT NULL DEFAULT 'principal',
  "titulo" TEXT NOT NULL DEFAULT 'Contrato de arrendamiento',
  "contenido" TEXT NOT NULL DEFAULT '',
  "clausulas" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "plantillas_contrato_pkey" PRIMARY KEY ("id")
);
