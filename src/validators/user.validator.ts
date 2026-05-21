import { z } from 'zod';

export const userStatusSchema = z.object({
  status: z.enum(['active', 'blocked']),
});
