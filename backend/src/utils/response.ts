import { Response } from 'express';
import { ApiResponse, PaginationMeta } from '../types';

/** 200 OK */
export function success<T>(res: Response, data: T, message?: string, status = 200): Response {
  const body: ApiResponse<T> = { success: true, data, message };
  return res.status(status).json(body);
}

/** 201 Created */
export function created<T>(res: Response, data: T, message = 'Resource created successfully'): Response {
  return success(res, data, message, 201);
}

/** 200 OK + pagination meta */
export function paginated<T>(
  res: Response,
  data: T[],
  meta: PaginationMeta,
  message?: string
): Response {
  const body: ApiResponse<T[]> = { success: true, data, message, pagination: meta };
  return res.status(200).json(body);
}

/** 400 Bad Request */
export function badRequest(res: Response, error: string): Response {
  const body: ApiResponse = { success: false, error };
  return res.status(400).json(body);
}

/** 401 Unauthorized */
export function unauthorized(res: Response, error = 'Unauthorized'): Response {
  const body: ApiResponse = { success: false, error };
  return res.status(401).json(body);
}

/** 403 Forbidden */
export function forbidden(res: Response, error = 'Forbidden'): Response {
  const body: ApiResponse = { success: false, error };
  return res.status(403).json(body);
}

/** 404 Not Found */
export function notFound(res: Response, error = 'Resource not found'): Response {
  const body: ApiResponse = { success: false, error };
  return res.status(404).json(body);
}

/** 409 Conflict */
export function conflict(res: Response, error: string): Response {
  const body: ApiResponse = { success: false, error };
  return res.status(409).json(body);
}

/** 500 Internal Server Error */
export function serverError(res: Response, error = 'Internal server error'): Response {
  const body: ApiResponse = { success: false, error };
  return res.status(500).json(body);
}
