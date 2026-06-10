import { z } from 'zod'
import { positiveInt, positiveNumber } from './numeric'

export const recipeLineSchema = z.object({
  ingredientId: positiveInt,
  quantityPerUnit: positiveNumber
})

export const recipeUpdateSchema = z.object({
  lines: z.array(recipeLineSchema).default([])
})

export type RecipeLine = z.infer<typeof recipeLineSchema>
export type RecipeUpdate = z.infer<typeof recipeUpdateSchema>
