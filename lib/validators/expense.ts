import { z } from 'zod'
import { positiveNumber } from './numeric'

export const expenseCreateSchema = z.object({
  title: z.string().min(1),
  category: z.string().min(1),
  amount: positiveNumber,
  expenseDate: z.string().optional(),
  notes: z.string().optional()
})

export type ExpenseCreate = z.infer<typeof expenseCreateSchema>

export const expensePatchSchema = expenseCreateSchema.partial()

export type ExpensePatch = z.infer<typeof expensePatchSchema>
