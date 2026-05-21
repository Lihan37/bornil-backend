import { z } from 'zod';

const formBoolean = z.preprocess((value) => {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false' || value === undefined) return false;
  return value;
}, z.boolean());

export const categorySchema = z.object({
  name: z.string().min(2).max(80),
  image: z.string().url().optional().or(z.literal('')),
  isFeatured: formBoolean.default(false),
});
