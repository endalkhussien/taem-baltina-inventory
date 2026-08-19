import { z } from 'zod'
import { positiveNumber } from './numeric'

export const marketOrderItemSchema = z.object({
  productId: z.coerce.number().int().positive(),
  quantityKg: positiveNumber
})

export const marketOrderCreateSchema = z.object({
  customerName: z.string().trim().min(2, 'Name is required.'),
  customerPhone: z.string().trim().min(7, 'Phone number is required.'),
  customerEmail: z
    .string()
    .trim()
    .email('Enter a valid email.')
    .optional()
    .or(z.literal('')),
  deliveryAddress: z.string().trim().min(5, 'Delivery address is required.'),
  city: z.string().trim().min(2, 'City is required.').default('Addis Ababa'),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
  paymentMethod: z.enum(['cod', 'telebirr', 'cbe', 'transfer']).default('cod'),
  items: z.array(marketOrderItemSchema).min(1, 'Add at least one product.')
})

export const marketOrderStatusSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'fulfilled', 'cancelled'])
})

export type MarketOrderCreateInput = z.infer<typeof marketOrderCreateSchema>
