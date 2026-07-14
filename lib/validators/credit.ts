import { z } from 'zod'
import { nonNegativeNumber, positiveInt, positiveNumber } from './numeric'

export const creditLineSchema = z.object({
  productId: positiveInt,
  quantityKg: positiveNumber
})

export const creditLedgerCreateSchema = z
  .object({
    customerId: positiveInt,
    lines: z.array(creditLineSchema).optional().default([]),
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
  .refine((data) => {
    const lines = data.lines ?? []
    const legacyProduct = Number(data.productId ?? 0) > 0 && Number(data.quantityKg ?? 0) > 0
    return lines.length > 0 || legacyProduct
  }, {
    message: 'Enter kg for at least one product.',
    path: ['lines']
  })

export const creditPaymentSchema = z.object({
  creditId: positiveInt,
  amount: positiveNumber,
  paymentDate: z.string().optional(),
  notes: z.string().optional()
})

export type CreditLineInput = z.infer<typeof creditLineSchema>
