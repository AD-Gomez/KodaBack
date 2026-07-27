-- CreateTable
CREATE TABLE "fotos_reparacion" (
    "id" TEXT NOT NULL,
    "reparacion_id" TEXT NOT NULL,
    "nombre_archivo" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "datos" TEXT NOT NULL,
    "observacion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fotos_reparacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "fotos_reparacion_reparacion_id_idx" ON "fotos_reparacion"("reparacion_id");

-- AddForeignKey
ALTER TABLE "fotos_reparacion" ADD CONSTRAINT "fotos_reparacion_reparacion_id_fkey" FOREIGN KEY ("reparacion_id") REFERENCES "reparaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
