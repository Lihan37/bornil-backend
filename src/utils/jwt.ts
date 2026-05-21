import jwt from 'jsonwebtoken';
import type { Secret, SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import type { AuthPayload } from '../types';

export function signToken(payload: AuthPayload) {
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.JWT_SECRET as Secret, options);
}

export function verifyToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET as Secret) as AuthPayload;
}
