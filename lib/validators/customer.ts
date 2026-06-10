import { z } from 'zod'

export const customerCreateSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
  notes: z.string().optional()
})

export const customerPatchSchema = customerCreateSchema.partial()

export type CustomerCreate = z.infer<typeof customerCreateSchema>
export type CustomerPatch = z.infer<typeof customerPatchSchema>
