import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { badRequest } from '../utils/response';

export function handleValidationErrors(req: Request, res: Response, next: NextFunction): any {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMsg = errors.array().map(err => err.msg).join(', ');
    return badRequest(res, `Validation Error: ${errorMsg}`);
  }
  return next();
}
