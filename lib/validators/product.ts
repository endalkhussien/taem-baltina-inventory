import { z } from 'zod'
import { nonNegativeNumber, nonNegativeInt } from './numeric'

export const productCreateSchema = z.object({
  name: z.string().min(1),
  sellingPrice: nonNegativeNumber,
  stockQuantity: nonNegativeInt.optional().default(0),
  alertThreshold: nonNegativeInt.optional().default(0)
})

export type ProductCreate = z.infer<typeof productCreateSchema>
