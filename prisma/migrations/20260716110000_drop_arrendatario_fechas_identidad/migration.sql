-- Eliminar columnas de fechas de identidad del arrendatario
ALTER TABLE "arrendatarios" DROP COLUMN "fecha_expedicion";
ALTER TABLE "arrendatarios" DROP COLUMN "fecha_vencimiento";