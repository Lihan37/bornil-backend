import { z } from 'zod';

export const userStatusSchema = z.object({
  status: z.enum(['active', 'blocked']),
});

export const passwordResetDecisionSchema = z.object({
  adminNote: z.string().max(500).optional(),
});