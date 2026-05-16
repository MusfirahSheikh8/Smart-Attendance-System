import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { serverError, badRequest } from '../utils/response';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): any {
  logger.error('Unhandled Exception:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: (req.method === 'POST' || req.method === 'PUT') ? req.body : undefined,
  });

  // Handle specific Oracle DB errors if necessary
  if (err.errorNum) {
    if (err.errorNum === 1) { // ORA-00001: unique constraint violated
      return badRequest(res, 'A record with this information already exists.');
    }
    // More Oracle-specific errors could be mapped here
  }

  // Fallback to generic 500 error
  return serverError(res, process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message);
}
