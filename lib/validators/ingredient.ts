import { z } from 'zod'
import { nonNegativeNumber } from './numeric'

export const ingredientCreateSchema = z.object({
  name: z.string().min(1),
  quantity: nonNegativeNumber,
  unit: z.string().min(1),
  costPerUnit: nonNegativeNumber,
  alertThreshold: nonNegativeNumber.optional().default(0)
})

export type IngredientCreate = z.infer<typeof ingredientCreateSchema>
