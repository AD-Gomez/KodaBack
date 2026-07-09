import { AppError } from './AppError.js';

export class ConflictError extends AppError {
  constructor(message: string = 'Conflicto con el estado actual') {
    super(message, 409, 'CONFLICT');
  }
}