import type { User } from '../types';

export function sanitizeUser(user: User) {
  const { passwordHash, ...safeUser } = user;
  void passwordHash;
  return safeUser;
}
