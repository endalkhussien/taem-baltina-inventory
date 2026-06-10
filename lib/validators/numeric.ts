import { z } from 'zod'

export const toNumber = z.union([z.string(), z.number()]).transform((v) => Number(v))

export const positiveNumber = toNumber.pipe(z.number().positive())
export const nonNegativeNumber = toNumber.pipe(z.number().nonnegative())
export const positiveInt = toNumber.pipe(z.number().int().positive())
export const nonNegativeInt = toNumber.pipe(z.number().int().nonnegative())
