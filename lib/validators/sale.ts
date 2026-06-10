import { z } from 'zod'
import { positiveInt, positiveNumber, nonNegativeNumber, nonNegativeInt } from './numeric'

export const saleCreateSchema = z.object({
  productId: positiveInt,
  customerId: nonNegativeInt.optional().default(0),
  quantity: positiveInt,
  unitPrice: positiveNumber,
  amountPaid: nonNegativeNumber.optional().default(0),
  saleDate: z.string().optional()
})

export type SaleCreate = z.infer<typeof saleCreateSchema>

export const repaymentSchema = z.object({
  saleId: positiveInt,
  amount: positiveNumber,
  paymentDate: z.string().optional()
})

export type RepaymentCreate = z.infer<typeof repaymentSchema>
