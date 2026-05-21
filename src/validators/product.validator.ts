import { z } from 'zod';

const formBoolean = z.preprocess((value) => {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false' || value === undefined) return false;
  return value;
}, z.boolean());

export const productSchema = z.object({
  name: z.string().min(2).max(140),
  category: z.string().min(2).max(80),
  price: z.coerce.number().positive(),
  oldPrice: z.coerce.number().positive().optional(),
  description: z.string().min(10).max(4000),
  material: z.string().min(1).max(120),
  color: z.string().min(1).max(80),
  size: z.string().min(1).max(80),
  stock: z.coerce.number().int().min(0),
  isFeatured: formBoolean.default(false),
  isBestSelling: formBoolean.default(false),
  status: z.enum(['active', 'draft', 'archived']).optional().default('active'),
  existingImages: z
    .preprocess((value) => {
      if (!value) return [];
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') {
        try {
          return JSON.parse(value);
        } catch {
          return [];
        }
      }
      return [];
    }, z.array(z.object({ url: z.string().url(), publicId: z.string().min(1) })))
    .optional()
    .default([]),
});

export const productUpdateSchema = productSchema.partial().extend({
  existingImages: productSchema.shape.existingImages,
});
