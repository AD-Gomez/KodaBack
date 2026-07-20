-- Reemplazar el estado VIGENTE por EN_PROCESO y FIRMADO.
-- El estado del contrato ahora refleja el ciclo de firma:
--   BORRADOR (creado) -> EN_PROCESO (al enviarse la primera solicitud de firma)
--                       -> FIRMADO (cuando todos los envios están firmados)
ALTER TYPE "EstadoContrato" RENAME VALUE 'VIGENTE' TO 'FIRMADO';
ALTER TYPE "EstadoContrato" ADD VALUE 'EN_PROCESO' BEFORE 'FIRMADO';
