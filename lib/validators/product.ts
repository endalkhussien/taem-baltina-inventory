import { z } from 'zod'
import { nonNegativeNumber, nonNegativeInt } from './numeric'

export const productCreateSchema = z.object({
  name: z.string().min(1),
  sellingPrice: nonNegativeNumber,
  /** Opening / on-hand stock in kg (decimals allowed). */
  stockQuantity: nonNegativeNumber.optional().default(0),
  alertThreshold: nonNegativeInt.optional().default(0)
})

export const productUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  sellingPrice: nonNegativeNumber.optional(),
  /** Set manually for beginning inventory or stock corrections. */
  stockQuantity: nonNegativeNumber.optional(),
  alertThreshold: nonNegativeInt.optional()
})

export type ProductCreate = z.infer<typeof productCreateSchema>
export type ProductUpdate = z.infer<typeof productUpdateSchema>
