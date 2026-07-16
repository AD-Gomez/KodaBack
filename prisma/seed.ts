import { PrismaClient, type Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';

import { env } from '../src/config/env.js';

const prisma = new PrismaClient();

// Helper para fechas con día específico del mes (ej. día 15)
const d = (day: number, monthIndex: number, year: number): Date => {
  // monthIndex: 0 = Enero
  return new Date(Date.UTC(year, monthIndex, day));
};

async function main(): Promise<void> {
  // eslint-disable-next-line no-console
  console.log('🌱 Iniciando seed...');

  // Limpiar datos existentes (en orden inverso a dependencias)
  await prisma.historialContrato.deleteMany();
  await prisma.documentoContrato.deleteMany();
  await prisma.envioFirma.deleteMany();
  await prisma.firma.deleteMany();
  await prisma.clausula.deleteMany();
  await prisma.contrato.deleteMany();
  await prisma.pago.deleteMany();
  await prisma.servicioActivo.deleteMany();
  await prisma.reparacion.deleteMany();
  await prisma.documento.deleteMany();
  await prisma.arrendatario.deleteMany();
  await prisma.departamento.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.usuario.deleteMany();

  // ============== USUARIOS ==============
  const passwordHash = await bcrypt.hash(env.DEMO_PASSWORD, env.BCRYPT_ROUNDS);

  const admin = await prisma.usuario.create({
    data: {
      nombre: 'AD Gomez',
      email: 'admin@kodahouse.com',
      passwordHash,
      rol: 'ADMIN',
    },
  });

  const contador = await prisma.usuario.create({
    data: {
      nombre: 'María',
      email: 'contador@kodahouse.com',
      passwordHash,
      rol: 'CONTADOR',
    },
  });

  const abogado = await prisma.usuario.create({
    data: {
      nombre: 'Juan',
      email: 'abogado@kodahouse.com',
      passwordHash,
      rol: 'ABOGADO',
    },
  });

  // eslint-disable-next-line no-console
  console.log(`✅ Usuarios creados: ${admin.email}, ${contador.email}, ${abogado.email}`);

  // ============== DEPARTAMENTOS ==============
  const departamentosData = [
    {
      nombre: 'FUNDEMOS',
      direccion: 'Edificio Parari Apartamento 2D, Av Teresa, calle principal Fundemos',
      puntoReferencia: 'Diagonal a Carlos Pizza, primer edificio',
      montoCompra: 13044,
      alquiler: 500,
      distribucion: '77.87 m² - 2 Habitaciones, 1 Baño, Sala-comedor-cocina',
      inmobiliario: 'Nevera, Cocina, 2 aires de ventana, Lavadora/Secadora, 2 muebles',
      serviciosActivos: 'Mantenimiento Aire - Próximo: 15-10-2026',
      renovacionContrato: d(15, 10, 2026),
      estado: 'OCUPADO' as const,
      imagen: '🏢',
    },
    {
      nombre: 'TRINIDAD 1D',
      direccion: 'Edificio Trinidad Apartamento 1D, Diagonal Av Juncal',
      puntoReferencia: 'Diagonal a Plaza Hugo Chávez Fría',
      montoCompra: 18634,
      alquiler: 650,
      distribucion: '86.27 m² - 3 Habitaciones, 2 Baños, Sala-comedor, Cocina',
      inmobiliario:
        'Nevera, Cocina, Tanque de agua, 1 cama matrimonial con colchón, 1 cama individual con colchón, 1 mueble negro',
      serviciosActivos: 'Aire - Próximo: 16-10-2026',
      renovacionContrato: d(15, 3, 2027),
      estado: 'OCUPADO' as const,
      imagen: '🏢',
    },
    {
      nombre: 'BRISAS',
      direccion: 'Edificio Las Brisas Apartamento 8C, Calle Juana Ramírez',
      puntoReferencia: 'Arriba de Fiorca Supermercado, a una calle de UBV',
      montoCompra: 20844,
      alquiler: 750,
      distribucion: '95.05 m² - 3 Habitaciones, 2 Baños, Balcón, Sala-comedor-cocina',
      inmobiliario: 'Nevera, Cocina, Lavadora, 3 aires de ventana 5,000 BTU, 1 aire de sala de 14,000 BTU',
      serviciosActivos: 'Aire - Próximo: 15-11-2026',
      renovacionContrato: d(15, 4, 2027),
      estado: 'OCUPADO' as const,
      imagen: '🏢',
    },
    {
      nombre: 'ADRIANA 2B',
      direccion: 'Edificio Adriana Piso 2 Apartamento 2B, Av Libertador',
      puntoReferencia: 'Al lado de Fiorca Libertador',
      montoCompra: 13221,
      alquiler: 480,
      distribucion: '80 m² - 2 Habitaciones, 1 Baño, Sala-comedor, Cocina',
      inmobiliario: 'Nevera, Cocina, Tanque de agua, Lavadora/Secadora, 3 aires split',
      serviciosActivos: 'Aire - Próximo: 30-12-2026',
      renovacionContrato: d(15, 8, 2026),
      estado: 'OCUPADO' as const,
      imagen: '🏢',
    },
    {
      nombre: 'ADRIANA 2C',
      direccion: 'Edificio Adriana Piso 2 Apartamento 2C, Av Libertador',
      puntoReferencia: 'Al lado de Fiorca Libertador',
      montoCompra: 17097,
      alquiler: 480,
      distribucion: '80 m² - 2 Habitaciones, 1 Baño, Sala-comedor, Cocina',
      inmobiliario: 'Nevera, Cocina, Tanque de agua, Cama individual, 3 aires split',
      serviciosActivos: 'Aire - Próximo: 15-10-2026',
      renovacionContrato: d(15, 8, 2026),
      estado: 'OCUPADO' as const,
      imagen: '🏢',
    },
    {
      nombre: 'JARDINES',
      direccion: 'Edificio Los Claveles Piso 3 Apartamento 3C, Residencias Los Jardines, Av Libertador',
      puntoReferencia: 'Al lado del Tama',
      montoCompra: 15991,
      alquiler: 550,
      distribucion: '81 m² - 3 Habitaciones, 2 Baños, Sala-comedor, Cocina',
      inmobiliario: 'Nevera, Cocina, 2 aires split',
      serviciosActivos: 'Aire - Próximo: 20-07-2026',
      renovacionContrato: d(15, 11, 2026),
      estado: 'OCUPADO' as const,
      imagen: '🏢',
    },
    {
      nombre: 'TRINIDAD 9B',
      direccion: 'Edificio Trinidad Apartamento 9B, Diagonal Av Juncal',
      puntoReferencia: 'Diagonal a Plaza Hugo Chávez Fría',
      montoCompra: 18553,
      alquiler: 650,
      distribucion: '86.27 m² - 3 Habitaciones, 2 Baños, Sala-comedor, Cocina',
      inmobiliario: 'Nevera, Cocina, 3 aires de ventana, Tanque de agua',
      serviciosActivos: 'Aire - Próximo: 15-06-2026',
      renovacionContrato: d(15, 10, 2026),
      estado: 'OCUPADO' as const,
      imagen: '🏢',
    },
  ];

  const departamentos = [];
  for (const depto of departamentosData) {
    const created = await prisma.departamento.create({ data: depto });
    departamentos.push(created);
  }
  // eslint-disable-next-line no-console
  console.log(`✅ Departamentos creados: ${departamentos.length}`);

  // ============== ARRENDATARIOS ==============
  type ArrendatarioSeed = Prisma.ArrendatarioUncheckedCreateInput;

  const arrendatariosData: ArrendatarioSeed[] = [
    {
      nombre: 'JOSE ALEJANDRO MATA',
      email: 'jose.mata@email.com',
      telefono: '+58 424 123 4567',
      telefonoFamiliar: '+58 424 765 4321',
      nombreFamiliar: 'María Mata (Esposa)',
      direccion: 'Calle Principal, Fundemos',
      departamentoId: departamentos[0]!.id,
      fechaIngreso: d(15, 0, 2023),
      estado: 'ACTIVO',
      renta: 500,
      historialPagos: '✅ Al día',
      avatar: '👤',
      notas: 'Inquilino puntual. Buen trato con los vecinos.',
      fechaExpedicion: d(10, 4, 2020),
      fechaVencimiento: d(10, 4, 2030),
    },
    {
      nombre: 'WINDA ROSMARY FEBRES PINTO',
      email: 'winda.febres@email.com',
      telefono: '+58 424 234 5678',
      telefonoFamiliar: '+58 424 876 5432',
      nombreFamiliar: 'Pedro Febres (Hermano)',
      direccion: 'Diagonal Av Juncal, Trinidad',
      departamentoId: departamentos[1]!.id,
      fechaIngreso: d(20, 2, 2023),
      estado: 'ACTIVO',
      renta: 650,
      historialPagos: '✅ Al día',
      avatar: '👩',
      notas: 'Pago puntual. Excelente inquilina.',
      fechaExpedicion: d(15, 7, 2021),
      fechaVencimiento: d(15, 7, 2031),
    },
    {
      nombre: 'MARIA JOSE AGUILERA COVA',
      email: 'maria.aguilera@email.com',
      telefono: '+58 424 345 6789',
      telefonoFamiliar: '+58 424 987 6543',
      nombreFamiliar: 'Carlos Aguilera (Esposo)',
      direccion: 'Calle Juana Ramírez, Brisas',
      departamentoId: departamentos[2]!.id,
      fechaIngreso: d(10, 5, 2023),
      estado: 'ACTIVO',
      renta: 750,
      historialPagos: '✅ Al día',
      avatar: '👩‍💼',
      notas: 'Inquilina excelente. Recomendada.',
      fechaExpedicion: d(20, 0, 2022),
      fechaVencimiento: d(20, 0, 2032),
    },
    {
      nombre: 'LUIS FERNANDO CAMARA CASTILLO',
      email: 'luis.camara@email.com',
      telefono: '+58 424 456 7890',
      telefonoFamiliar: '+58 424 109 8765',
      nombreFamiliar: 'Ana Camara (Madre)',
      direccion: 'Av Libertador, Adriana 2B',
      departamentoId: departamentos[3]!.id,
      fechaIngreso: d(1, 10, 2023),
      estado: 'ACTIVO',
      renta: 480,
      historialPagos: '✅ Al día',
      avatar: '👨',
      notas: 'Inquilino responsable. Paga puntualmente.',
      fechaExpedicion: d(20, 2, 2020),
      fechaVencimiento: d(20, 2, 2030),
    },
    {
      nombre: 'CAMILA ALEXANDRA GONZALEZ PETTI',
      email: 'camila.gonzalez@email.com',
      telefono: '+58 424 567 8901',
      telefonoFamiliar: '+58 424 210 9876',
      nombreFamiliar: 'Andrés González (Hermano)',
      direccion: 'Av Libertador, Adriana 2C',
      departamentoId: departamentos[4]!.id,
      fechaIngreso: d(1, 11, 2023),
      estado: 'ACTIVO',
      renta: 480,
      historialPagos: '✅ Al día',
      avatar: '👩',
      notas: 'Inquilina responsable.',
      fechaExpedicion: d(15, 5, 2021),
      fechaVencimiento: d(15, 5, 2031),
    },
    {
      nombre: 'FABIOLA VALENTINA RODRIGUEZ CABELLO',
      email: 'fabiola.rodriguez@email.com',
      telefono: '+58 424 678 9012',
      telefonoFamiliar: '+58 424 321 0987',
      nombreFamiliar: 'José Rodríguez (Padre)',
      direccion: 'Av Libertador, Los Jardines',
      departamentoId: departamentos[5]!.id,
      fechaIngreso: d(5, 0, 2024),
      estado: 'ACTIVO',
      renta: 550,
      historialPagos: '✅ Al día',
      avatar: '👩‍💼',
      notas: 'Contrato vigente. Buena inquilina.',
      fechaExpedicion: d(25, 10, 2022),
      fechaVencimiento: d(25, 10, 2032),
    },
    {
      nombre: 'BARBARA ANDREINA HERNANDEZ TORRES',
      email: 'barbara.hernandez@email.com',
      telefono: '+58 424 789 0123',
      telefonoFamiliar: '+58 424 432 1098',
      nombreFamiliar: 'Miguel Hernández (Padre)',
      direccion: 'Diagonal Av Juncal, Trinidad 9B',
      departamentoId: departamentos[6]!.id,
      fechaIngreso: d(15, 6, 2023),
      estado: 'ACTIVO',
      renta: 650,
      historialPagos: '✅ Al día',
      avatar: '👩',
      notas: 'Inquilina responsable.',
      fechaExpedicion: d(25, 10, 2019),
      fechaVencimiento: d(25, 10, 2029),
    },
  ];

  const arrendatarios = [];
  for (const a of arrendatariosData) {
    const created = await prisma.arrendatario.create({ data: a });
    arrendatarios.push(created);

    // Documentos básicos
    await prisma.documento.createMany({
      data: [
        { arrendatarioId: created.id, nombre: 'Cédula', tipo: 'CEDULA', url: '#' },
        { arrendatarioId: created.id, nombre: 'Comprobante de domicilio', tipo: 'COMPROBANTE_DOMICILIO', url: '#' },
      ],
    });
  }
  // eslint-disable-next-line no-console
  console.log(`✅ Arrendatarios creados: ${arrendatarios.length}`);

  // ============== CONTRATOS ==============
  const contratosData = [
    {
      departamentoId: departamentos[0]!.id,
      arrendatarioId: arrendatarios[0]!.id,
      version: 3,
      fechaInicio: d(15, 0, 2024),
      fechaFin: d(15, 10, 2026),
      estado: 'VIGENTE' as const,
      clausulas: [
        'El arrendatario se compromete a pagar la renta el día 5 de cada mes',
        'Prohibido subarrendar sin autorización del propietario',
        'El mantenimiento del jardín corre por cuenta del arrendatario',
        'Aviso de 30 días para terminación del contrato',
        'Ajuste anual del 5% según IPC',
      ],
    },
    {
      departamentoId: departamentos[1]!.id,
      arrendatarioId: arrendatarios[1]!.id,
      version: 2,
      fechaInicio: d(20, 2, 2023),
      fechaFin: d(15, 3, 2027),
      estado: 'VIGENTE' as const,
      clausulas: [
        'El arrendatario se compromete a pagar la renta el día 5 de cada mes',
        'Sin mascotas',
        'Mantenimiento del jardín por cuenta del arrendatario',
      ],
    },
    {
      departamentoId: departamentos[2]!.id,
      arrendatarioId: arrendatarios[2]!.id,
      version: 2,
      fechaInicio: d(10, 5, 2023),
      fechaFin: d(15, 4, 2027),
      estado: 'VIGENTE' as const,
      clausulas: [
        'El arrendatario se compromete a pagar la renta el día 5 de cada mes',
        'Mantenimiento del jardín por cuenta del arrendatario',
        'No subarrendar',
      ],
    },
    {
      departamentoId: departamentos[3]!.id,
      arrendatarioId: arrendatarios[3]!.id,
      version: 1,
      fechaInicio: d(1, 10, 2023),
      fechaFin: d(15, 8, 2026),
      estado: 'VIGENTE' as const,
      clausulas: [
        'El arrendatario se compromete a pagar la renta el día 5 de cada mes',
        'Mantenimiento del jardín',
        'Seguro de hogar obligatorio',
      ],
    },
    {
      departamentoId: departamentos[4]!.id,
      arrendatarioId: arrendatarios[4]!.id,
      version: 1,
      fechaInicio: d(1, 11, 2023),
      fechaFin: d(15, 8, 2026),
      estado: 'VIGENTE' as const,
      clausulas: ['Pago puntual', 'Mantenimiento del jardín'],
    },
    {
      departamentoId: departamentos[5]!.id,
      arrendatarioId: arrendatarios[5]!.id,
      version: 1,
      fechaInicio: d(5, 0, 2024),
      fechaFin: d(15, 11, 2026),
      estado: 'VIGENTE' as const,
      clausulas: ['Pago puntual', 'No subarrendar'],
    },
    {
      departamentoId: departamentos[6]!.id,
      arrendatarioId: arrendatarios[6]!.id,
      version: 2,
      fechaInicio: d(15, 6, 2023),
      fechaFin: d(15, 10, 2026),
      estado: 'VIGENTE' as const,
      clausulas: ['Pago puntual', 'No subarrendar'],
    },
  ];

  for (const c of contratosData) {
    const contrato = await prisma.contrato.create({
      data: {
        departamentoId: c.departamentoId,
        arrendatarioId: c.arrendatarioId,
        version: c.version,
        fechaInicio: c.fechaInicio,
        fechaFin: c.fechaFin,
        estado: c.estado,
        creadoPorId: admin.id,
        clausulas: {
          create: c.clausulas.map((texto, i) => ({ texto, orden: i + 1, editable: true })),
        },
        firmas: {
          create: [
            {
              nombre: arrendatariosData[contratosData.indexOf(c)]!.nombre,
              email: arrendatariosData[contratosData.indexOf(c)]!.email,
              tipo: 'ARRENDATARIO',
              estado: 'FIRMADO',
              fecha: c.fechaInicio,
            },
            {
              nombre: 'KodaHouse Propietario',
              email: 'admin@kodahouse.com',
              tipo: 'PROPIETARIO',
              estado: 'FIRMADO',
              fecha: new Date(c.fechaInicio.getTime() + 24 * 60 * 60 * 1000),
            },
          ],
        },
        historial: {
          create: [
            {
              version: 1,
              fecha: c.fechaInicio,
              cambios: 'Creación del contrato',
            },
            {
              version: c.version,
              fecha: c.fechaInicio,
              cambios: `Versión actual v${c.version}`,
            },
          ],
        },
        documentos: {
          create: [
            {
              nombre: `Contrato v${c.version}.pdf`,
              tipo: 'CONTRATO',
              url: '#',
              fecha: c.fechaInicio,
            },
            {
              nombre: 'Anexo de cláusulas.pdf',
              tipo: 'ANEXO',
              url: '#',
              fecha: c.fechaInicio,
            },
          ],
        },
      },
    });
    void contrato;
  }
  // eslint-disable-next-line no-console
  console.log(`✅ Contratos creados: ${contratosData.length}`);

  // ============== REPARACIONES ==============
  const reparacionesData = [
    {
      titulo: 'Fuga de agua en baño principal',
      descripcion: 'Fuga en la tubería del lavabo que afecta el piso del baño principal',
      departamentoId: departamentos[0]!.id,
      prioridad: 'ALTA' as const,
      estado: 'EN_PROCESO' as const,
      fechaSolicitud: d(10, 5, 2026),
      fechaProgramada: d(12, 5, 2026),
      costo: 4500,
      solicitanteId: admin.id,
      tecnico: 'Juan Pérez',
      tipo: 'PLOMERIA' as const,
      notas: 'Se requiere cerrar el agua general para la reparación',
    },
    {
      titulo: 'Aire acondicionado no enfría',
      descripcion: 'El aire acondicionado del salón no enfría adecuadamente',
      departamentoId: departamentos[1]!.id,
      prioridad: 'MEDIA' as const,
      estado: 'PENDIENTE' as const,
      fechaSolicitud: d(15, 5, 2026),
      fechaProgramada: d(20, 5, 2026),
      tecnico: null,
      tipo: 'AIRE_ACONDICIONADO' as const,
      notas: 'Revisar nivel de gas refrigerante',
    },
    {
      titulo: 'Revisión de instalación eléctrica',
      descripcion: 'Luces parpadean en la cocina, posible problema eléctrico',
      departamentoId: departamentos[2]!.id,
      prioridad: 'URGENTE' as const,
      estado: 'COMPLETADA' as const,
      fechaSolicitud: d(5, 5, 2026),
      fechaProgramada: d(6, 5, 2026),
      fechaCompletada: d(8, 5, 2026),
      costo: 2800,
      solicitanteId: admin.id,
      tecnico: 'Carlos Ramírez',
      tipo: 'ELECTRICA' as const,
      notas: 'Se cambió el interruptor general',
    },
    {
      titulo: 'Jardinería - Poda de árboles',
      descripcion: 'Los árboles del jardín necesitan poda y mantenimiento',
      departamentoId: departamentos[0]!.id,
      prioridad: 'BAJA' as const,
      estado: 'PENDIENTE' as const,
      fechaSolicitud: d(18, 5, 2026),
      fechaProgramada: d(25, 5, 2026),
      solicitanteId: admin.id,
      tipo: 'JARDINERIA' as const,
      notas: 'Programar con el jardinero',
    },
    {
      titulo: 'Cambio de cerradura principal',
      descripcion: 'La cerradura de la puerta principal está dañada',
      departamentoId: departamentos[3]!.id,
      prioridad: 'ALTA' as const,
      estado: 'EN_PROCESO' as const,
      fechaSolicitud: d(12, 5, 2026),
      fechaProgramada: d(14, 5, 2026),
      costo: 1500,
      solicitanteId: admin.id,
      tecnico: 'Pedro López',
      tipo: 'CERRAJERIA' as const,
      notas: 'Se requiere cerradura de seguridad',
    },
  ];

  for (const r of reparacionesData) {
    await prisma.reparacion.create({ data: r });
  }
  // eslint-disable-next-line no-console
  console.log(`✅ Reparaciones creadas: ${reparacionesData.length}`);

  // ============== SERVICIOS ACTIVOS ==============
  const serviciosData = [
    {
      nombre: 'Mantenimiento de Aire Acondicionado',
      departamentoId: departamentos[1]!.id,
      tipo: 'AIRE_ACONDICIONADO' as const,
      frecuencia: 'MENSUAL' as const,
      proximaFecha: d(15, 6, 2026),
      estado: 'ACTIVO' as const,
      proveedor: 'ClimaTotal S.A.',
      costoMensual: 1200,
    },
    {
      nombre: 'Jardinería y Mantenimiento de Jardín',
      departamentoId: departamentos[0]!.id,
      tipo: 'JARDINERIA' as const,
      frecuencia: 'QUINCENAL' as const,
      proximaFecha: d(25, 5, 2026),
      estado: 'ACTIVO' as const,
      proveedor: 'VerdeVivo',
      costoMensual: 2500,
    },
    {
      nombre: 'Mantenimiento de Aire Acondicionado',
      departamentoId: departamentos[2]!.id,
      tipo: 'AIRE_ACONDICIONADO' as const,
      frecuencia: 'MENSUAL' as const,
      proximaFecha: d(10, 6, 2026),
      estado: 'ACTIVO' as const,
      proveedor: 'ClimaTotal S.A.',
      costoMensual: 1500,
    },
    {
      nombre: 'Limpieza de Cisterna',
      departamentoId: departamentos[0]!.id,
      tipo: 'PLOMERIA' as const,
      frecuencia: 'TRIMESTRAL' as const,
      proximaFecha: d(1, 7, 2026),
      estado: 'PROGRAMADO' as const,
      proveedor: 'Aguas Limpias',
      costoMensual: 3500,
    },
  ];

  for (const s of serviciosData) {
    await prisma.servicioActivo.create({ data: s });
  }
  // eslint-disable-next-line no-console
  console.log(`✅ Servicios activos creados: ${serviciosData.length}`);

  // eslint-disable-next-line no-console
  console.log('\n🎉 Seed completado exitosamente');
  // eslint-disable-next-line no-console
  console.log('\n📝 Credenciales de acceso:');
  // eslint-disable-next-line no-console
  console.log(`   Email: ${admin.email} | Password: ${env.DEMO_PASSWORD}`);
  // eslint-disable-next-line no-console
  console.log(`   Email: ${contador.email} | Password: ${env.DEMO_PASSWORD}`);
  // eslint-disable-next-line no-console
  console.log(`   Email: ${abogado.email} | Password: ${env.DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });