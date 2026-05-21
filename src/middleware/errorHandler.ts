import type { ErrorRequestHandler, RequestHandler } from 'express';
import { MongoServerError } from 'mongodb';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new AppError(404, `Route not found: ${req.originalUrl}`));
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.flatten(),
    });
  }

  if (error instanceof MongoServerError && error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate value already exists',
    });
  }

  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const message = error instanceof AppError ? error.message : 'Internal server error';

  return res.status(statusCode).json({
    success: false,
    message,
    stack: env.NODE_ENV === 'development' ? error.stack : undefined,
  });
};
