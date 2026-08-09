import { z } from 'zod'
import { positiveInt, nonNegativeNumber } from './numeric'

export const productionCreateSchema = z.object({
  productId: positiveInt,
  batchCount: positiveInt.optional().default(1),
  quantityProduced: positiveInt,
  producedAt: z.string().optional(),
  notes: z.string().optional(),
  laborCost: nonNegativeNumber.optional().default(0),
  equipmentCost: nonNegativeNumber.optional().default(0),
  otherOverhead: nonNegativeNumber.optional().default(0)
})

export type ProductionCreate = z.infer<typeof productionCreateSchema>
