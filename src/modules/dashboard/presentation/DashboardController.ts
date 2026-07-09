import type { Request, Response } from 'express';

import { asyncHandler } from '../../../shared/utils/asyncHandler.js';

import { DashboardService } from '../application/DashboardService.js';

export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  summary = asyncHandler(async (_req: Request, res: Response) => {
    const data = await this.service.getSummary();
    res.json({ success: true, data });
  });
}