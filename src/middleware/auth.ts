import type { NextFunction, Request, Response } from 'express';
import { getDB } from '../db/connectDB';
import { verifyToken } from '../utils/jwt';
import { toObjectId } from '../utils/objectId';
import { AppError } from '../utils/AppError';

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    if (!token) throw new AppError(401, 'Authentication required');

    const payload = verifyToken(token);
    const db = getDB();
    const user = await db.collection('users').findOne({ _id: toObjectId(payload.userId) }, { projection: { _id: 1, role: 1 } });
    if (!user) throw new AppError(401, 'Invalid or expired token');

    req.user = { userId: payload.userId, role: user.role };
    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError(401, 'Invalid or expired token'));
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role !== 'admin') {
    next(new AppError(403, 'Admin access required'));
    return;
  }
  next();
}
