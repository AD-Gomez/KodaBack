-- Conservar el rol en la solicitud firmada evita depender de coincidencias por correo
-- al decidir dónde debe aparecer cada firma en el PDF.
ALTER TABLE "envios_firma" ADD COLUMN "tipo" "TipoFirma";

-- Compatibilidad con solicitudes ya existentes.
UPDATE "envios_firma" AS envio
SET "tipo" = (
  SELECT firma."tipo"
  FROM "firmas" AS firma
  WHERE firma."contrato_id" = envio."contrato_id"
    AND firma."email" IS NOT NULL
    AND LOWER(TRIM(firma."email")) = LOWER(TRIM(envio."email"))
  ORDER BY firma."id"
  LIMIT 1
)
WHERE envio."tipo" IS NULL;
