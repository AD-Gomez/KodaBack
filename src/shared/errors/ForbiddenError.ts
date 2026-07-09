import { AppError } from './AppError.js';

export class ForbiddenError extends AppError {
  constructor(message: string = 'Acceso prohibido') {
    super(message, 403, 'FORBIDDEN');
  }
}