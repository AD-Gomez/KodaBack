import type { Notificacion } from '@prisma/client';

export type { Notificacion };

export interface CreateNotificacionInput {
  usuarioId: string;
  tipo: string;
  titulo: string;
  descripcion: string;
  enlace?: string;
  clave: string;
}

export interface NotificacionRepository {
  findByUsuario(usuarioId: string, limit: number): Promise<Notificacion[]>;
  upsert(data: CreateNotificacionInput): Promise<Notificacion>;
  markAsRead(id: string, usuarioId: string): Promise<Notificacion | null>;
  markAllAsRead(usuarioId: string): Promise<number>;
}
