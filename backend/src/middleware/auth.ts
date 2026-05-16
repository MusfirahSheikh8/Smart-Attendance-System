import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { unauthorized, forbidden } from '../utils/response';
import { JwtPayload } from '../types';

// Extend Express Request object to include the decoded user payload
declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload;
  }
}

/**
 * Validates JWT token from the Authorization header
 */
export function authenticate(req: Request, res: Response, next: NextFunction): any {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return unauthorized(res, 'Missing or invalid authorization header');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.user = decoded;
    return next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return unauthorized(res, 'Token expired');
    }
    return unauthorized(res, 'Invalid token');
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): any => {
    if (!req.user) {
      return unauthorized(res, 'Authentication required');
    }

    // console.log(`[AUTH] Checking role for user ${req.user.username}. Has: ${req.user.role}, Allowed: ${allowedRoles}`);

    if (!allowedRoles.includes(req.user.role)) {
      console.warn(`[AUTH] Access denied for user ${req.user.username}. Role ${req.user.role} not in ${allowedRoles}`);
      return forbidden(res, `Required role(s): ${allowedRoles.join(', ')}`);
    }

    return next();
  };
}
