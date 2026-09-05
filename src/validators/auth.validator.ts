import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().regex(/^01[0-9]{9}$/, 'Use a valid Bangladesh phone number'),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(6).max(100),
});

export const loginSchema = z.object({
  phone: z.string().regex(/^01[0-9]{9}$/, 'Use a valid Bangladesh phone number'),
  password: z.string().min(6),
});

export const passwordResetRequestSchema = z.object({
  phone: z.string().regex(/^01[0-9]{9}$/, 'Use a valid Bangladesh phone number'),
  password: z.string().min(6).max(100),
});

export const passwordResetDecisionSchema = z.object({
  adminNote: z.string().max(500).optional(),
});