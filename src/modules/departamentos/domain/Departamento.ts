import type {
  Departamento,
  EstadoDepartamento,
} from '@prisma/client';

export type { Departamento, EstadoDepartamento };

export interface DepartamentoWithRelations extends Departamento {
  arrendatario?: {
    id: string;
    nombre: string;
    telefono: string;
    email: string;
  } | null;
  _count?: {
    contratos: number;
    reparaciones: number;
  };
}