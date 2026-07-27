import { describe, expect, it, vi } from 'vitest';

import {
  CreateContratoUseCase,
  FirmarEnvioUseCase,
  type EnvioPdfRegenerator,
} from './ContratoUseCases.js';
import type { ContratoRepository } from '../domain/ContratoRepository.js';

describe('CreateContratoUseCase', () => {
  it('asigna la siguiente versión disponible para el departamento', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'contrato-nuevo' });
    const findById = vi.fn().mockResolvedValue({ id: 'contrato-nuevo', version: 3 });
    const findMany = vi.fn().mockResolvedValue([{ version: 2 }, { version: 1 }]);
    const repository = { create, findById, findMany } as unknown as ContratoRepository;
    const useCase = new CreateContratoUseCase(repository);

    await useCase.execute({
      departamentoId: 'departamento-1',
      arrendatarioId: 'arrendatario-1',
      fechaInicio: '2026-08-01',
      fechaFin: '2027-08-01',
    });

    expect(findMany).toHaveBeenCalledWith({ departamentoId: 'departamento-1' });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ version: 3 }));
  });

  it('convierte una colisión de versión en un conflicto controlado', async () => {
    const repository = {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockRejectedValue({ code: 'P2002' }),
    } as unknown as ContratoRepository;
    const useCase = new CreateContratoUseCase(repository);

    await expect(
      useCase.execute({
        departamentoId: 'departamento-1',
        arrendatarioId: 'arrendatario-1',
        fechaInicio: '2026-08-01',
        fechaFin: '2027-08-01',
      }),
    ).rejects.toMatchObject({ statusCode: 409, code: 'CONFLICT' });
  });
});

describe('FirmarEnvioUseCase', () => {
  const firmaDataUrl = 'data:image/png;base64,AAAA';

  function buildEnvio(overrides: Record<string, unknown> = {}) {
    return {
      id: 'envio-1',
      contratoId: 'contrato-1',
      nombre: 'Alne',
      email: 'alne@example.com',
      tipo: 'ARRENDATARIO',
      token: 'token-1',
      estado: 'PENDIENTE',
      fechaEnvio: new Date('2026-07-20T10:00:00Z'),
      fechaFirmado: null,
      nombreLegal: null,
      firmaData: null,
      cedulaFrenteUrl: null,
      cedulaReversoUrl: null,
      pdfUrl: null,
      pdfGeneradoAt: null,
      ipFirmado: null,
      userAgent: null,
      ...overrides,
    };
  }

  function buildContrato(envios: ReturnType<typeof buildEnvio>[]) {
    return {
      id: 'contrato-1',
      departamentoId: 'depto-1',
      arrendatarioId: 'arrendatario-1',
      version: 1,
      fechaInicio: new Date('2026-08-01'),
      fechaFin: new Date('2027-08-01'),
      estado: 'EN_PROCESO',
      titulo: 'Contrato demo',
      contenido: '<p>contenido</p>',
      url: null,
      creadoPorId: 'usuario-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      departamento: { id: 'depto-1', nombre: 'Depto 1', direccion: 'Calle 1' },
      arrendatario: { id: 'arrendatario-1', nombre: 'Alne', email: 'alne@example.com' },
      clausulas: [],
      firmas: [],
      envios,
      documentos: [],
      historial: [],
    };
  }

  it('regenera el PDF de todos los envíos firmados al firmar uno nuevo', async () => {
    const envioPendiente = buildEnvio();
    const envioPrevioFirmado = buildEnvio({
      id: 'envio-0',
      token: 'token-0',
      nombre: 'Anyel',
      email: 'anyel@example.com',
      tipo: 'PROPIETARIO',
      estado: 'FIRMADO',
      fechaFirmado: new Date('2026-07-25T12:00:00Z'),
      nombreLegal: 'Anyel',
      firmaData: firmaDataUrl,
    });
    const contratoInicial = buildContrato([envioPendiente, envioPrevioFirmado]);
    const envioRecienFirmado = {
      ...envioPendiente,
      estado: 'FIRMADO',
      fechaFirmado: new Date('2026-07-26T12:00:00Z'),
      nombreLegal: 'Alne',
      firmaData: firmaDataUrl,
    };
    const contratoTrasFirma = buildContrato([envioRecienFirmado, envioPrevioFirmado]);
    const contratoTrasMarcarFirmado = buildContrato([
      envioRecienFirmado,
      envioPrevioFirmado,
    ]);
    Object.assign(contratoTrasMarcarFirmado, { estado: 'FIRMADO' });

    const findEnvioFirmaByToken = vi.fn().mockResolvedValue(envioPendiente);
    // Primera llamada: validación inicial (envio todavía PENDIENTE).
    // Segunda llamada: dentro de tryRegenerateAllPdfs, tras marcar como
    // firmado, debe ver el estado actualizado con ambos envios FIRMADO.
    const findById = vi
      .fn()
      .mockResolvedValueOnce(contratoInicial)
      .mockResolvedValueOnce(contratoTrasFirma)
      .mockResolvedValueOnce(contratoTrasMarcarFirmado);
    const markEnvioFirmaFirmado = vi.fn().mockResolvedValue(envioRecienFirmado);
    const update = vi.fn().mockResolvedValue(contratoTrasMarcarFirmado);

    const repository = {
      findEnvioFirmaByToken,
      findById,
      markEnvioFirmaFirmado,
      update,
    } as unknown as ContratoRepository;

    const regenerateForEnvio = vi
      .fn()
      .mockResolvedValue({ envio: {}, pdfUrl: 'pdf-url', generated: true });
    const pdfRegenerator: EnvioPdfRegenerator = { regenerateForEnvio };

    const useCase = new FirmarEnvioUseCase(repository, undefined, pdfRegenerator);
    await useCase.execute('token-1', { nombreLegal: 'Alne', firmaData: firmaDataUrl });

    expect(markEnvioFirmaFirmado).toHaveBeenCalledTimes(1);
    // El regenerador debe invocarse para AMBOS envíos firmados (el recién
    // firmado y el que ya estaba firmado desde antes).
    expect(regenerateForEnvio).toHaveBeenCalledTimes(2);
    const enviosLlamados = regenerateForEnvio.mock.calls.map(([envio]) => envio.id).sort();
    expect(enviosLlamados).toEqual(['envio-0', 'envio-1']);
  });

  it('sigue funcionando cuando no se inyecta un regenerador de PDF', async () => {
    const envioPendiente = buildEnvio();
    const contrato = buildContrato([envioPendiente]);
    const repository = {
      findEnvioFirmaByToken: vi.fn().mockResolvedValue(envioPendiente),
      findById: vi.fn().mockResolvedValue(contrato),
      markEnvioFirmaFirmado: vi.fn().mockResolvedValue({
        ...envioPendiente,
        estado: 'FIRMADO',
        fechaFirmado: new Date('2026-07-26T12:00:00Z'),
        nombreLegal: 'Alne',
        firmaData: firmaDataUrl,
      }),
      update: vi.fn(),
    } as unknown as ContratoRepository;

    const useCase = new FirmarEnvioUseCase(repository);
    const result = await useCase.execute('token-1', {
      nombreLegal: 'Alne',
      firmaData: firmaDataUrl,
    });
    expect(result.estado).toBe('FIRMADO');
  });

  it('continúa con la firma si la regeneración de un PDF previo falla', async () => {
    const envioPendiente = buildEnvio();
    const envioPrevioFirmado = buildEnvio({
      id: 'envio-0',
      token: 'token-0',
      estado: 'FIRMADO',
      fechaFirmado: new Date('2026-07-25T12:00:00Z'),
      nombreLegal: 'Anyel',
      firmaData: firmaDataUrl,
    });
    const contratoInicial = buildContrato([envioPendiente, envioPrevioFirmado]);
    const envioRecienFirmado = {
      ...envioPendiente,
      estado: 'FIRMADO',
      fechaFirmado: new Date('2026-07-26T12:00:00Z'),
      nombreLegal: 'Alne',
      firmaData: firmaDataUrl,
    };
    const contratoTrasFirma = buildContrato([envioRecienFirmado, envioPrevioFirmado]);
    const contratoTrasMarcarFirmado = buildContrato([
      envioRecienFirmado,
      envioPrevioFirmado,
    ]);
    Object.assign(contratoTrasMarcarFirmado, { estado: 'FIRMADO' });

    const repository = {
      findEnvioFirmaByToken: vi.fn().mockResolvedValue(envioPendiente),
      findById: vi
        .fn()
        .mockResolvedValueOnce(contratoInicial)
        .mockResolvedValueOnce(contratoTrasFirma)
        .mockResolvedValueOnce(contratoTrasMarcarFirmado),
      markEnvioFirmaFirmado: vi.fn().mockResolvedValue(envioRecienFirmado),
      update: vi.fn().mockResolvedValue(contratoTrasMarcarFirmado),
    } as unknown as ContratoRepository;

    const regenerateForEnvio = vi
      .fn()
      .mockImplementation(async (envio: { id: string }) => {
        if (envio.id === 'envio-0') {
          throw new Error('S3 caído');
        }
        return { envio: {}, pdfUrl: 'pdf-url', generated: true };
      });
    const pdfRegenerator: EnvioPdfRegenerator = { regenerateForEnvio };

    const useCase = new FirmarEnvioUseCase(repository, undefined, pdfRegenerator);
    const result = await useCase.execute('token-1', {
      nombreLegal: 'Alne',
      firmaData: firmaDataUrl,
    });

    expect(result.estado).toBe('FIRMADO');
    expect(regenerateForEnvio).toHaveBeenCalledTimes(2);
  });
});
