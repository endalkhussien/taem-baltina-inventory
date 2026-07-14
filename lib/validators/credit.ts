import { z } from 'zod'
import { nonNegativeNumber, positiveInt, positiveNumber } from './numeric'

export const creditLedgerCreateSchema = z.object({
  customerId: positiveInt,
  title: z.string().min(1),
  totalAmount: positiveNumber,
  amountPaid: nonNegativeNumber.optional().default(0),
  creditDate: z.string().optional(),
  notes: z.string().optional()
}).refine((data) => (data.amountPaid ?? 0) <= data.totalAmount, {
  message: 'Paid now cannot be more than total credit.',
  path: ['amountPaid']
})

export const creditPaymentSchema = z.object({
  creditId: positiveInt,
  amount: positiveNumber,
  paymentDate: z.string().optional(),
  notes: z.string().optional()
})
