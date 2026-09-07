import { z } from 'zod';

export const browserTrackingSchema = z.object({
  fbp: z.string().max(200).optional(),
  fbc: z.string().max(200).optional(),
  eventSourceUrl: z.string().url().max(2048).optional(),
}).optional();

export const metaEventSchema = z.object({
  eventName: z.enum(['ViewContent', 'AddToCart', 'InitiateCheckout']),
  eventId: z.string().min(8).max(200),
  items: z.array(z.object({
    productId: z.string().min(1).max(64),
    quantity: z.coerce.number().int().min(1).max(99),
  })).min(1).max(50),
  fbp: z.string().max(200).optional(),
  fbc: z.string().max(200).optional(),
  eventSourceUrl: z.string().url().max(2048).optional(),
});
