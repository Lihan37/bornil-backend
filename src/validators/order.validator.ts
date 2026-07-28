import { z } from 'zod';

export const orderSchema = z.object({
  customerName: z.string().min(2).max(80),
  phone: z.string().regex(/^01[0-9]{9}$/, 'Use a valid Bangladesh phone number'),
  address: z.string().min(8).max(500),
  paymentMethod: z.literal('cash_on_delivery'),
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.coerce.number().int().min(1).max(99),
  })).min(1),
});

export const orderStatusSchema = z.object({
  orderStatus: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'paid', 'cancelled']),
});
