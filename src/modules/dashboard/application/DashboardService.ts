import type { PrismaClient } from '@prisma/client';

export interface DashboardSummary {
  departamentos: {
    total: number;
    ocupados: number;
    vacios: number;
    ocupacionPorcentaje: number;
    ingresoMensual: number;
    profitMensual: number;
    inversionTotal: number;
  };
  arrendatarios: {
    activos: number;
    morosos: number;
    inactivos: number;
  };
  reparaciones: {
    total: number;
    pendientes: number;
    urgentes: number;
    inversionTotal: number;
  };
  contratos: {
    firmados: number;
    porVencer: number;
    borradores: number;
  };
  finanzas: {
    ingresosMensuales: number;
    profitMensual: number;
    rentabilidad: number;
  };
}

export class DashboardService {
  constructor(private readonly prisma: PrismaClient) {}

  async getSummary(): Promise<DashboardSummary> {
    const [
      totalDeptos,
      ocupados,
      ingresosAgg,
      inversionAgg,
      activos,
      morosos,
      inactivos,
      totalRep,
      pendientesRep,
      urgentesRep,
      inversionRep,
      contratosFirmados,
      contratosBorradores,
    ] = await Promise.all([
      this.prisma.departamento.count(),
      this.prisma.departamento.count({ where: { estado: 'OCUPADO' } }),
      this.prisma.departamento.aggregate({ _sum: { alquiler: true } }),
      this.prisma.departamento.aggregate({ _sum: { montoCompra: true } }),
      this.prisma.arrendatario.count({ where: { estado: 'ACTIVO' } }),
      this.prisma.arrendatario.count({ where: { estado: 'MOROSO' } }),
      this.prisma.arrendatario.count({ where: { estado: 'INACTIVO' } }),
      this.prisma.reparacion.count(),
      this.prisma.reparacion.count({ where: { estado: { in: ['PENDIENTE', 'EN_PROCESO'] } } }),
      this.prisma.reparacion.count({
        where: { prioridad: 'URGENTE', estado: { not: 'COMPLETADA' } },
      }),
      this.prisma.reparacion.aggregate({ _sum: { costo: true } }),
      this.prisma.contrato.count({ where: { estado: 'FIRMADO' } }),
      this.prisma.contrato.count({ where: { estado: 'BORRADOR' } }),
    ]);

    const ahora = new Date();
    const en30Dias = new Date(ahora);
    en30Dias.setDate(en30Dias.getDate() + 30);

    const porVencer = await this.prisma.contrato.count({
      where: {
        estado: 'FIRMADO',
        fechaFin: { gte: ahora, lte: en30Dias },
      },
    });

    const ingresoMensual = Number(ingresosAgg._sum.alquiler ?? 0);
    const inversionTotal = Number(inversionAgg._sum.montoCompra ?? 0);
    const profitMensual = Math.round(ingresoMensual * 0.65);
    const rentabilidad =
      inversionTotal === 0 ? 0 : Math.round((profitMensual / inversionTotal) * 100);

    return {
      departamentos: {
        total: totalDeptos,
        ocupados,
        vacios: totalDeptos - ocupados,
        ocupacionPorcentaje: totalDeptos === 0 ? 0 : Math.round((ocupados / totalDeptos) * 100),
        ingresoMensual,
        profitMensual,
        inversionTotal,
      },
      arrendatarios: {
        activos,
        morosos,
        inactivos,
      },
      reparaciones: {
        total: totalRep,
        pendientes: pendientesRep,
        urgentes: urgentesRep,
        inversionTotal: Number(inversionRep._sum.costo ?? 0),
      },
      contratos: {
        firmados: contratosFirmados,
        porVencer,
        borradores: contratosBorradores,
      },
      finanzas: {
        ingresosMensuales: ingresoMensual,
        profitMensual,
        rentabilidad,
      },
    };
  }
}