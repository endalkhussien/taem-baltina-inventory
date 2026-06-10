"use client"

import React, { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useIngredients } from '../hooks/useModules'

type RecipeLineForm = {
  ingredientId: number
  quantityPerUnit: number
}

type Props = {
  productId: number | null
  productName?: string
}

export default function ProductRecipeEditor({ productId, productName }: Props) {
  const qc = useQueryClient()
  const { data: ingredients } = useIngredients()
  const ingredientList = Array.isArray(ingredients) ? ingredients : []
  const [lines, setLines] = useState<RecipeLineForm[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const recipe = useQuery({
    queryKey: ['recipe', productId],
    enabled: Boolean(productId),
    queryFn: async () => {
      const res = await fetch(`/api/products/${productId}/recipe`)
      if (!res.ok) throw new Error('Failed to load recipe')
      return res.json()
    }
  })

  useEffect(() => {
    if (!productId) {
      setLines([])
      return
    }

    if (recipe.data?.lines) {
      setLines(
        recipe.data.lines.map((line: any) => ({
          ingredientId: line.ingredient_id,
          quantityPerUnit: Number(line.quantity_per_unit)
        }))
      )
    }
  }, [productId, recipe.data])

  const materialCost = lines.reduce((sum, line) => {
    const ingredient = ingredientList.find((item) => item.id === line.ingredientId)
    return sum + (ingredient ? Number(ingredient.cost_per_unit) * Number(line.quantityPerUnit || 0) : 0)
  }, 0)

  const saveRecipe = async () => {
    if (!productId) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/products/${productId}/recipe`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines })
      })
      if (!res.ok) throw new Error('Could not save recipe')
      await qc.invalidateQueries({ queryKey: ['recipe', productId] })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save recipe')
    } finally {
      setSaving(false)
    }
  }

  if (!productId) {
    return (
      <div className="card border-dashed">
        <h2 className="font-display text-lg font-semibold text-earth-900">Recipe / BOM</h2>
        <p className="text-sm text-earth-500 mt-2">Select a product recipe to manage the raw materials used for each produced unit.</p>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-earth-900">Recipe / BOM</h2>
          <p className="text-sm text-earth-500">Raw materials used to produce one unit of {productName ?? 'this product'}.</p>
        </div>
        <div className="rounded-xl bg-spice-50 px-3 py-2 text-sm text-spice-800">
          Material cost: <span className="font-semibold">{materialCost.toFixed(2)} ETB</span>
        </div>
      </div>

      <div className="space-y-3">
        {lines.map((line, index) => {
          const ingredient = ingredientList.find((item) => item.id === line.ingredientId)

          return (
            <div key={index} className="grid grid-cols-1 gap-2 rounded-xl border border-earth-100 bg-earth-50/60 p-3 sm:grid-cols-[1fr_140px_80px]">
              <select
                className="input-field"
                value={line.ingredientId || ''}
                onChange={(event) => {
                  const next = [...lines]
                  next[index] = { ...line, ingredientId: Number(event.target.value) }
                  setLines(next)
                }}
              >
                <option value="">Choose raw material</option>
                {ingredientList.map((item) => (
                  <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>
                ))}
              </select>
              <input
                className="input-field"
                type="number"
                step="0.001"
                min="0"
                value={line.quantityPerUnit}
                onChange={(event) => {
                  const next = [...lines]
                  next[index] = { ...line, quantityPerUnit: Number(event.target.value) }
                  setLines(next)
                }}
                placeholder="Qty/unit"
              />
              <button
                className="btn-secondary !px-3"
                type="button"
                onClick={() => setLines(lines.filter((_, lineIndex) => lineIndex !== index))}
              >
                Remove
              </button>
              {ingredient && (
                <div className="sm:col-span-3 text-xs text-earth-500">
                  Uses {line.quantityPerUnit || 0} {ingredient.unit} per unit at {Number(ingredient.cost_per_unit).toFixed(2)} ETB/{ingredient.unit}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {error && <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          className="btn-secondary"
          type="button"
          onClick={() => setLines([...lines, { ingredientId: ingredientList[0]?.id ?? 0, quantityPerUnit: 0.001 }])}
        >
          Add raw material
        </button>
        <button className="btn-primary" type="button" disabled={saving || recipe.isLoading} onClick={saveRecipe}>
          {saving ? 'Saving...' : 'Save recipe'}
        </button>
      </div>
    </div>
  )
}
