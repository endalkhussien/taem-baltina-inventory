import { z } from 'zod'
import { positiveInt, positiveNumber } from './numeric'

export const purchaseCreateSchema = z.object({
  ingredientId: positiveInt,
  quantity: positiveNumber,
  costTotal: positiveNumber,
  supplier: z.string().optional(),
  purchaseDate: z.string().optional()
})

export type PurchaseCreate = z.infer<typeof purchaseCreateSchema>
