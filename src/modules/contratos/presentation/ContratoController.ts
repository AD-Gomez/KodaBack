import type { Request, Response } from 'express';

import { NotFoundError } from '../../../shared/errors/index.js';
import { asyncHandler } from '../../../shared/utils/asyncHandler.js';

import {
  AddClausulaUseCase,
  AddDocumentoUseCase,
  AddEnvioFirmaUseCase,
  AddFirmaUseCase,
  CreateContratoUseCase,
  DeleteContratoUseCase,
  GetContratoUseCase,
  GetCurrentContratoByDepartamentoUseCase,
  ListContratosUseCase,
  RemoveClausulaUseCase,
  RemoveDocumentoUseCase,
  RemoveEnvioFirmaUseCase,
  RemoveFirmaUseCase,
  RenovarContratoUseCase,
  UpdateClausulaUseCase,
  UpdateContratoUseCase,
  UpdateFirmaEstadoUseCase,
} from '../application/ContratoUseCases.js';
import type {
  ClausulaDto,
  CreateContratoDto,
  DocumentoContratoDto,
  EnvioFirmaDto,
  FirmaDto,
  RenovarContratoDto,
  UpdateClausulaDto,
  UpdateContratoDto,
  UpdateFirmaEstadoDto,
} from './contratoValidators.js';

export class ContratoController {
  constructor(
    private readonly listUseCase: ListContratosUseCase,
    private readonly getUseCase: GetContratoUseCase,
    private readonly getCurrentUseCase: GetCurrentContratoByDepartamentoUseCase,
    private readonly createUseCase: CreateContratoUseCase,
    private readonly updateUseCase: UpdateContratoUseCase,
    private readonly renovarUseCase: RenovarContratoUseCase,
    private readonly deleteUseCase: DeleteContratoUseCase,
    private readonly addClausulaUseCase: AddClausulaUseCase,
    private readonly updateClausulaUseCase: UpdateClausulaUseCase,
    private readonly removeClausulaUseCase: RemoveClausulaUseCase,
    private readonly addFirmaUseCase: AddFirmaUseCase,
    private readonly updateFirmaUseCase: UpdateFirmaEstadoUseCase,
    private readonly removeFirmaUseCase: RemoveFirmaUseCase,
    private readonly addEnvioUseCase: AddEnvioFirmaUseCase,
    private readonly removeEnvioUseCase: RemoveEnvioFirmaUseCase,
    private readonly addDocumentoUseCase: AddDocumentoUseCase,
    private readonly removeDocumentoUseCase: RemoveDocumentoUseCase,
  ) {}

  list = asyncHandler(async (req: Request, res: Response) => {
    const q = req.query as { departamentoId?: string; arrendatarioId?: string; estado?: string };
    const data = await this.listUseCase.execute(q);
    res.json({ success: true, data });
  });

  get = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.getUseCase.execute(req.params.id!);
    res.json({ success: true, data });
  });

  getCurrentByDepartamento = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.getCurrentUseCase.execute(req.params.departamentoId!);
    res.json({ success: true, data });
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const dto = req.body as CreateContratoDto & { creadoPorId?: string };
    const data = await this.createUseCase.execute({ ...dto, creadoPorId: req.user!.id });
    res.status(201).json({ success: true, data });
  });

  update = asyncHandler(async (req: Request, res: Response) => {
    try {
      const data = await this.updateUseCase.execute(req.params.id!, req.body as UpdateContratoDto);
      res.json({ success: true, data });
    } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new NotFoundError('Contrato');
    }
  });

  renovar = asyncHandler(async (req: Request, res: Response) => {
    try {
      const dto = req.body as RenovarContratoDto;
      const data = await this.renovarUseCase.execute(req.params.id!, { ...dto, creadoPorId: req.user!.id });
      res.status(201).json({ success: true, data });
    } catch (err) {
      if (err instanceof NotFoundError) throw err;
      throw new NotFoundError('Contrato');
    }
  });

  delete = asyncHandler(async (req: Request, res: Response) => {
    try {
      await this.deleteUseCase.execute(req.params.id!);
      res.status(204).send();
    } catch {
      throw new NotFoundError('Contrato');
    }
  });

  // Cláusulas
  addClausula = asyncHandler(async (req: Request, res: Response) => {
    const dto = req.body as ClausulaDto;
    const data = await this.addClausulaUseCase.execute(req.params.id!, dto.texto, dto.orden);
    res.status(201).json({ success: true, data });
  });

  updateClausula = asyncHandler(async (req: Request, res: Response) => {
    const { texto } = req.body as UpdateClausulaDto;
    const data = await this.updateClausulaUseCase.execute(req.params.clausulaId!, texto);
    res.json({ success: true, data });
  });

  removeClausula = asyncHandler(async (req: Request, res: Response) => {
    await this.removeClausulaUseCase.execute(req.params.clausulaId!);
    res.status(204).send();
  });

  // Firmas
  addFirma = asyncHandler(async (req: Request, res: Response) => {
    const dto = req.body as FirmaDto;
    const data = await this.addFirmaUseCase.execute({ ...dto, contratoId: req.params.id! });
    res.status(201).json({ success: true, data });
  });

  updateFirmaEstado = asyncHandler(async (req: Request, res: Response) => {
    const { estado } = req.body as UpdateFirmaEstadoDto;
    const data = await this.updateFirmaUseCase.execute(req.params.firmaId!, estado);
    res.json({ success: true, data });
  });

  removeFirma = asyncHandler(async (req: Request, res: Response) => {
    await this.removeFirmaUseCase.execute(req.params.firmaId!);
    res.status(204).send();
  });

  // Envíos
  addEnvio = asyncHandler(async (req: Request, res: Response) => {
    const dto = req.body as EnvioFirmaDto;
    const data = await this.addEnvioUseCase.execute({
      ...dto,
      contratoId: req.params.id!,
    });
    res.status(201).json({ success: true, data });
  });

  removeEnvio = asyncHandler(async (req: Request, res: Response) => {
    await this.removeEnvioUseCase.execute(req.params.envioId!);
    res.status(204).send();
  });

  // Documentos
  addDocumento = asyncHandler(async (req: Request, res: Response) => {
    const dto = req.body as DocumentoContratoDto;
    const data = await this.addDocumentoUseCase.execute({ ...dto, contratoId: req.params.id! });
    res.status(201).json({ success: true, data });
  });

  removeDocumento = asyncHandler(async (req: Request, res: Response) => {
    await this.removeDocumentoUseCase.execute(req.params.documentoId!);
    res.status(204).send();
  });
}