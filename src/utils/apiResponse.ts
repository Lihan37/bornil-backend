import type { Response } from 'express';

export function successResponse<T>(res: Response, statusCode: number, message: string, data?: T, meta?: unknown) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta,
  });
}
