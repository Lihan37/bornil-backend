import type { User } from '../types';

export function sanitizeUser(user: User) {
  const { passwordHash, passwordResetRequest, ...safeUser } = user;
  void passwordHash;
  return {
    ...safeUser,
    passwordResetRequest: passwordResetRequest
      ? {
        status: passwordResetRequest.status,
        adminNote: passwordResetRequest.adminNote,
        requestedAt: passwordResetRequest.requestedAt,
        respondedAt: passwordResetRequest.respondedAt,
      }
      : undefined,
  };
}