import { z } from 'zod'
import { positiveInt, positiveNumber, nonNegativeNumber } from './numeric'

export const saleCreateSchema = z.object({
  productId: positiveInt,
  quantity: positiveInt,
  unitPrice: positiveNumber,
  amountPaid: nonNegativeNumber.optional().default(0)
})

export type SaleCreate = z.infer<typeof saleCreateSchema>

export const repaymentSchema = z.object({
  saleId: positiveInt,
  amount: positiveNumber
})

export type RepaymentCreate = z.infer<typeof repaymentSchema>
