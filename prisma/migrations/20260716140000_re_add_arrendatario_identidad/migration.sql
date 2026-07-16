-- Re-agregar columnas de identidad del arrendatario
-- La migración previa drop_arrendatario_identidad se ejecutó en producción
-- y dropeó tipo_identidad/numero_identidad, pero el schema las volvió a
-- declarar como NOT NULL, así que las restauramos para que coincidan.
ALTER TABLE "arrendatarios" ADD COLUMN "tipo_identidad" TEXT NOT NULL DEFAULT 'Cédula';
ALTER TABLE "arrendatarios" ADD COLUMN "numero_identidad" TEXT NOT NULL DEFAULT '0000000';
