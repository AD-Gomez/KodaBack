CREATE TABLE IF NOT EXISTS "configuracion_sistema" (
  "id" TEXT NOT NULL,
  "dias_aviso_vencimiento" INTEGER NOT NULL DEFAULT 15,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "configuracion_sistema_pkey" PRIMARY KEY ("id")
);
