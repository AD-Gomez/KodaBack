-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ADMIN', 'CONTADOR', 'ABOGADO');

-- CreateEnum
CREATE TYPE "EstadoDepartamento" AS ENUM ('OCUPADO', 'VACIO', 'MANTENIMIENTO', 'RESERVADO');

-- CreateEnum
CREATE TYPE "EstadoArrendatario" AS ENUM ('ACTIVO', 'INACTIVO', 'MOROSO', 'PENDIENTE');

-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('CEDULA', 'CONTRATO', 'COMPROBANTE_DOMICILIO', 'CURP', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoContrato" AS ENUM ('BORRADOR', 'VIGENTE', 'VENCIDO', 'RENOVADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoFirma" AS ENUM ('ARRENDATARIO', 'PROPIETARIO', 'TESTIGO');

-- CreateEnum
CREATE TYPE "EstadoFirma" AS ENUM ('PENDIENTE', 'FIRMADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "PrioridadReparacion" AS ENUM ('BAJA', 'MEDIA', 'ALTA', 'URGENTE');

-- CreateEnum
CREATE TYPE "EstadoReparacion" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoReparacion" AS ENUM ('PLOMERIA', 'ELECTRICA', 'AIRE_ACONDICIONADO', 'JARDINERIA', 'CERRAJERIA', 'PINTURA', 'OTRO');

-- CreateEnum
CREATE TYPE "FrecuenciaServicio" AS ENUM ('SEMANAL', 'QUINCENAL', 'MENSUAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL');

-- CreateEnum
CREATE TYPE "EstadoServicio" AS ENUM ('ACTIVO', 'PROGRAMADO', 'PAUSADO', 'CANCELADO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol" "RolUsuario" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departamentos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "punto_referencia" TEXT,
    "monto_compra" DECIMAL(12,2) NOT NULL,
    "alquiler" DECIMAL(12,2) NOT NULL,
    "distribucion" TEXT NOT NULL,
    "inmobiliario" TEXT NOT NULL,
    "servicios_activos" TEXT,
    "renovacion_contrato" DATE,
    "estado" "EstadoDepartamento" NOT NULL DEFAULT 'VACIO',
    "imagen" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arrendatarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "telefono_familiar" TEXT,
    "nombre_familiar" TEXT,
    "direccion" TEXT,
    "departamento_id" TEXT,
    "fecha_ingreso" DATE NOT NULL,
    "estado" "EstadoArrendatario" NOT NULL DEFAULT 'ACTIVO',
    "renta" DECIMAL(12,2) NOT NULL,
    "historial_pagos" TEXT,
    "avatar" TEXT,
    "notas" TEXT,
    "tipo_identidad" TEXT NOT NULL,
    "numero_identidad" TEXT NOT NULL,
    "fecha_expedicion" DATE NOT NULL,
    "fecha_vencimiento" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "arrendatarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos" (
    "id" TEXT NOT NULL,
    "arrendatario_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoDocumento" NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contratos" (
    "id" TEXT NOT NULL,
    "departamento_id" TEXT NOT NULL,
    "arrendatario_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "estado" "EstadoContrato" NOT NULL DEFAULT 'BORRADOR',
    "url" TEXT,
    "creado_por_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contratos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clausulas" (
    "id" TEXT NOT NULL,
    "contrato_id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "editable" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clausulas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "firmas" (
    "id" TEXT NOT NULL,
    "contrato_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT,
    "tipo" "TipoFirma" NOT NULL,
    "estado" "EstadoFirma" NOT NULL DEFAULT 'PENDIENTE',
    "fecha" DATE,
    "hash" TEXT,

    CONSTRAINT "firmas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "envios_firma" (
    "id" TEXT NOT NULL,
    "contrato_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fecha_envio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "EstadoFirma" NOT NULL DEFAULT 'PENDIENTE',

    CONSTRAINT "envios_firma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos_contrato" (
    "id" TEXT NOT NULL,
    "contrato_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fecha" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documentos_contrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_contratos" (
    "id" TEXT NOT NULL,
    "contrato_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "cambios" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historial_contratos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reparaciones" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "departamento_id" TEXT NOT NULL,
    "prioridad" "PrioridadReparacion" NOT NULL,
    "estado" "EstadoReparacion" NOT NULL DEFAULT 'PENDIENTE',
    "fecha_solicitud" DATE NOT NULL,
    "fecha_programada" DATE,
    "fecha_completada" DATE,
    "costo" DECIMAL(12,2),
    "solicitante_id" TEXT,
    "tecnico" TEXT,
    "tipo" "TipoReparacion" NOT NULL,
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reparaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicios_activos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "departamento_id" TEXT NOT NULL,
    "tipo" "TipoReparacion" NOT NULL,
    "frecuencia" "FrecuenciaServicio" NOT NULL,
    "proxima_fecha" DATE NOT NULL,
    "estado" "EstadoServicio" NOT NULL DEFAULT 'ACTIVO',
    "proveedor" TEXT,
    "costo_mensual" DECIMAL(12,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servicios_activos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" TEXT NOT NULL,
    "departamento_id" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "fecha" DATE NOT NULL,
    "concepto" TEXT NOT NULL,
    "metodo_pago" TEXT,
    "referencia" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_usuario_id_idx" ON "refresh_tokens"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "departamentos_nombre_key" ON "departamentos"("nombre");

-- CreateIndex
CREATE INDEX "departamentos_estado_idx" ON "departamentos"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "arrendatarios_email_key" ON "arrendatarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "arrendatarios_departamento_id_key" ON "arrendatarios"("departamento_id");

-- CreateIndex
CREATE INDEX "arrendatarios_estado_idx" ON "arrendatarios"("estado");

-- CreateIndex
CREATE INDEX "arrendatarios_departamento_id_idx" ON "arrendatarios"("departamento_id");

-- CreateIndex
CREATE INDEX "documentos_arrendatario_id_idx" ON "documentos"("arrendatario_id");

-- CreateIndex
CREATE INDEX "contratos_estado_idx" ON "contratos"("estado");

-- CreateIndex
CREATE INDEX "contratos_arrendatario_id_idx" ON "contratos"("arrendatario_id");

-- CreateIndex
CREATE UNIQUE INDEX "contratos_departamento_id_version_key" ON "contratos"("departamento_id", "version");

-- CreateIndex
CREATE INDEX "clausulas_contrato_id_idx" ON "clausulas"("contrato_id");

-- CreateIndex
CREATE INDEX "firmas_contrato_id_idx" ON "firmas"("contrato_id");

-- CreateIndex
CREATE INDEX "envios_firma_contrato_id_idx" ON "envios_firma"("contrato_id");

-- CreateIndex
CREATE INDEX "documentos_contrato_contrato_id_idx" ON "documentos_contrato"("contrato_id");

-- CreateIndex
CREATE INDEX "historial_contratos_contrato_id_idx" ON "historial_contratos"("contrato_id");

-- CreateIndex
CREATE INDEX "reparaciones_estado_idx" ON "reparaciones"("estado");

-- CreateIndex
CREATE INDEX "reparaciones_departamento_id_idx" ON "reparaciones"("departamento_id");

-- CreateIndex
CREATE INDEX "servicios_activos_estado_idx" ON "servicios_activos"("estado");

-- CreateIndex
CREATE INDEX "servicios_activos_departamento_id_idx" ON "servicios_activos"("departamento_id");

-- CreateIndex
CREATE INDEX "pagos_departamento_id_idx" ON "pagos"("departamento_id");

-- CreateIndex
CREATE INDEX "pagos_fecha_idx" ON "pagos"("fecha");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arrendatarios" ADD CONSTRAINT "arrendatarios_departamento_id_fkey" FOREIGN KEY ("departamento_id") REFERENCES "departamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_arrendatario_id_fkey" FOREIGN KEY ("arrendatario_id") REFERENCES "arrendatarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_departamento_id_fkey" FOREIGN KEY ("departamento_id") REFERENCES "departamentos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_arrendatario_id_fkey" FOREIGN KEY ("arrendatario_id") REFERENCES "arrendatarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_creado_por_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clausulas" ADD CONSTRAINT "clausulas_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contratos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "firmas" ADD CONSTRAINT "firmas_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contratos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "envios_firma" ADD CONSTRAINT "envios_firma_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contratos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos_contrato" ADD CONSTRAINT "documentos_contrato_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contratos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_contratos" ADD CONSTRAINT "historial_contratos_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contratos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reparaciones" ADD CONSTRAINT "reparaciones_departamento_id_fkey" FOREIGN KEY ("departamento_id") REFERENCES "departamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reparaciones" ADD CONSTRAINT "reparaciones_solicitante_id_fkey" FOREIGN KEY ("solicitante_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicios_activos" ADD CONSTRAINT "servicios_activos_departamento_id_fkey" FOREIGN KEY ("departamento_id") REFERENCES "departamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
