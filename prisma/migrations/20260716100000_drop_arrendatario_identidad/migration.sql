-- Eliminar columnas de identidad del arrendatario
ALTER TABLE "arrendatarios" DROP COLUMN "tipo_identidad";
ALTER TABLE "arrendatarios" DROP COLUMN "numero_identidad";