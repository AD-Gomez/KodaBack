import { AppError } from './AppError.js';

export class ValidationError extends AppError {
  constructor(message: string = 'Datos inválidos', details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}