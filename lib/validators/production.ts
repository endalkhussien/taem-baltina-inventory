import { z } from 'zod'
import { positiveInt } from './numeric'

export const productionCreateSchema = z.object({
  productId: positiveInt,
  quantityProduced: positiveInt,
  producedAt: z.string().optional(),
  notes: z.string().optional()
})

export type ProductionCreate = z.infer<typeof productionCreateSchema>
