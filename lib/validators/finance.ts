import { z } from 'zod'
import { nonNegativeNumber } from './numeric'

export const cashEntrySchema = z.object({
  amount: nonNegativeNumber,
  notes: z.string().optional(),
  entryDate: z.string().optional()
})

export const liabilityCreateSchema = z.object({
  creditorName: z.string().min(1),
  category: z.enum(['bank', 'family', 'supplier', 'other']).default('other'),
  title: z.string().min(1),
  totalAmount: nonNegativeNumber,
  amountPaid: nonNegativeNumber.optional().default(0),
  liabilityDate: z.string().optional(),
  notes: z.string().optional()
})

export const liabilityPaymentSchema = z.object({
  liabilityId: z.number().int().positive(),
  amount: nonNegativeNumber.refine((value) => value > 0, 'Amount must be greater than zero.'),
  paymentDate: z.string().optional(),
  notes: z.string().optional()
})
