CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "enlace" TEXT,
    "clave" TEXT NOT NULL,
    "leida_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "notificaciones_usuario_id_clave_key" ON "notificaciones"("usuario_id", "clave");

CREATE INDEX "notificaciones_usuario_id_leida_at_created_at_idx" ON "notificaciones"("usuario_id", "leida_at", "created_at");

ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
