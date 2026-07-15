-- CreateEnum
CREATE TYPE "TipoInspeccion" AS ENUM ('ENTRADA', 'SALIDA', 'RUTINA');

-- CreateEnum
CREATE TYPE "EstadoInspeccion" AS ENUM ('EN_CURSO', 'COMPLETADA');

-- CreateEnum
CREATE TYPE "CondicionInspeccion" AS ENUM ('SIN_REVISAR', 'BIEN', 'OBSERVACION', 'DANO');

-- CreateTable
CREATE TABLE "inspecciones" (
    "id" TEXT NOT NULL,
    "departamento_id" TEXT NOT NULL,
    "inspector_id" TEXT NOT NULL,
    "tipo" "TipoInspeccion" NOT NULL,
    "estado" "EstadoInspeccion" NOT NULL DEFAULT 'EN_CURSO',
    "notas_generales" TEXT,
    "completada_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspecciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ambientes_inspeccion" (
    "id" TEXT NOT NULL,
    "inspeccion_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "requerido" BOOLEAN NOT NULL DEFAULT true,
    "condicion" "CondicionInspeccion" NOT NULL DEFAULT 'SIN_REVISAR',
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ambientes_inspeccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fotos_inspeccion" (
    "id" TEXT NOT NULL,
    "ambiente_id" TEXT NOT NULL,
    "nombre_archivo" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "datos" TEXT NOT NULL,
    "observacion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fotos_inspeccion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inspecciones_departamento_id_idx" ON "inspecciones"("departamento_id");
CREATE INDEX "inspecciones_inspector_id_idx" ON "inspecciones"("inspector_id");
CREATE INDEX "inspecciones_estado_idx" ON "inspecciones"("estado");
CREATE INDEX "ambientes_inspeccion_inspeccion_id_idx" ON "ambientes_inspeccion"("inspeccion_id");
CREATE UNIQUE INDEX "ambientes_inspeccion_inspeccion_id_nombre_key" ON "ambientes_inspeccion"("inspeccion_id", "nombre");
CREATE INDEX "fotos_inspeccion_ambiente_id_idx" ON "fotos_inspeccion"("ambiente_id");

-- AddForeignKey
ALTER TABLE "inspecciones" ADD CONSTRAINT "inspecciones_departamento_id_fkey" FOREIGN KEY ("departamento_id") REFERENCES "departamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inspecciones" ADD CONSTRAINT "inspecciones_inspector_id_fkey" FOREIGN KEY ("inspector_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ambientes_inspeccion" ADD CONSTRAINT "ambientes_inspeccion_inspeccion_id_fkey" FOREIGN KEY ("inspeccion_id") REFERENCES "inspecciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "fotos_inspeccion" ADD CONSTRAINT "fotos_inspeccion_ambiente_id_fkey" FOREIGN KEY ("ambiente_id") REFERENCES "ambientes_inspeccion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
