import { z } from 'zod'
import { nonNegativeNumber, positiveInt, positiveNumber } from './numeric'

export const creditLedgerCreateSchema = z
  .object({
    customerId: positiveInt,
    productId: nonNegativeNumber.optional().default(0),
    quantityKg: nonNegativeNumber.optional().default(0),
    title: z.string().optional(),
    totalAmount: positiveNumber,
    amountPaid: nonNegativeNumber.optional().default(0),
    creditDate: z.string().optional(),
    notes: z.string().optional()
  })
  .refine((data) => (data.amountPaid ?? 0) <= data.totalAmount, {
    message: 'Paid now cannot be more than total credit.',
    path: ['amountPaid']
  })
  .refine((data) => Number(data.productId ?? 0) > 0 || (data.title?.trim().length ?? 0) > 0, {
    message: 'Add a description for mixed / all-product credit.',
    path: ['title']
  })
  .refine((data) => Number(data.productId ?? 0) === 0 || Number(data.quantityKg ?? 0) > 0, {
    message: 'Enter kg quantity for the selected product.',
    path: ['quantityKg']
  })

export const creditPaymentSchema = z.object({
  creditId: positiveInt,
  amount: positiveNumber,
  paymentDate: z.string().optional(),
  notes: z.string().optional()
})
