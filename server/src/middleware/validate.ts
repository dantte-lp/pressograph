// ═══════════════════════════════════════════════════════════════════
// Request Validation Middleware
// ═══════════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { AppError } from './errorHandler';

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(err => ({
      field: err.type === 'field' ? err.path : undefined,
      message: err.msg,
    }));

    throw new AppError(
      JSON.stringify({ errors: errorMessages }),
      400
    );
  }

  next();
};
