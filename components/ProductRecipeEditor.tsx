"use client"

import React, { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useIngredients } from '../hooks/useModules'
import { useProducts, type Product } from '../hooks/useProducts'

type RecipeLineForm = {
  ingredientId: number
  quantityPerUnit: number
}

type Props = {
  productId: number | null
  productName?: string
  onProductSelect?: (id: number) => void
}

function dedupeLines(lines: RecipeLineForm[]): RecipeLineForm[] {
  const byIngredient = new Map<number, RecipeLineForm>()
  for (const line of lines) {
    if (!line.ingredientId || Number(line.quantityPerUnit) <= 0) continue
    byIngredient.set(line.ingredientId, line)
  }
  return Array.from(byIngredient.values())
}

export default function ProductRecipeEditor({ productId, productName, onProductSelect }: Props) {
  const qc = useQueryClient()
  const { data: ingredients } = useIngredients()
  const { data: products } = useProducts()
  const ingredientList = useMemo(() => (Array.isArray(ingredients) ? ingredients : []), [ingredients])
  const productList = useMemo(() => (Array.isArray(products) ? products : []), [products])
  const [lines, setLines] = useState<RecipeLineForm[]>([])
  const [copyFromId, setCopyFromId] = useState<number | ''>('')
  const [quickIngredientId, setQuickIngredientId] = useState<number | ''>('')
  const [quickQty, setQuickQty] = useState('1')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [copyMessage, setCopyMessage] = useState('')

  const copyableProducts = useMemo(
    () => productList.filter((product) => product.id !== productId && Number(product.recipe_line_count ?? 0) > 0),
    [productList, productId]
  )

  const getErrorMessage = async (res: Response, fallback: string) => {
    try {
      const body = await res.json()
      if (typeof body?.error === 'string') return body.error
      if (body?.error) return JSON.stringify(body.error)
    } catch {
      // Use fallback below.
    }

    return fallback
  }

  const recipe = useQuery({
    queryKey: ['recipe', productId],
    enabled: Boolean(productId),
    queryFn: async () => {
      const res = await fetch(`/api/products/${productId}/recipe`, { credentials: 'same-origin' })
      if (!res.ok) throw new Error(await getErrorMessage(res, 'Failed to load production recipe.'))
      return res.json()
    }
  })

  useEffect(() => {
    setLines([])
    setError('')
    setCopyMessage('')
    setCopyFromId('')
  }, [productId])

  useEffect(() => {
    if (!productId || recipe.isFetching) return

    const recipeLines = Array.isArray(recipe.data?.lines) ? recipe.data.lines : []
    setLines(
      recipeLines.map((line: any) => ({
        ingredientId: line.ingredient_id,
        quantityPerUnit: Number(line.quantity_per_unit)
      }))
    )
  }, [productId, recipe.data, recipe.isFetching])

  const hasInvalidLines = lines.some((line) => !line.ingredientId || Number(line.quantityPerUnit) <= 0)

  const materialCost = lines.reduce((sum, line) => {
    const ingredient = ingredientList.find((item) => item.id === line.ingredientId)
    return sum + (ingredient ? Number(ingredient.cost_per_unit) * Number(line.quantityPerUnit || 0) : 0)
  }, 0)

  const copyRecipeFrom = async (sourceProductId: number) => {
    setError('')
    setCopyMessage('')
    try {
      const res = await fetch(`/api/products/${sourceProductId}/recipe`, { credentials: 'same-origin' })
      if (!res.ok) throw new Error(await getErrorMessage(res, 'Could not load recipe to copy.'))
      const data = await res.json()
      const sourceLines = Array.isArray(data?.lines) ? data.lines : []
      if (sourceLines.length === 0) {
        setError('That product has no recipe yet.')
        return
      }
      setLines(
        sourceLines.map((line: any) => ({
          ingredientId: line.ingredient_id,
          quantityPerUnit: Number(line.quantity_per_unit)
        }))
      )
      const sourceName = productList.find((product) => product.id === sourceProductId)?.name ?? 'product'
      setCopyMessage(`Recipe copied from ${sourceName}. Click Save to apply.`)
      setCopyFromId('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not copy recipe.')
    }
  }

  const quickAddIngredient = () => {
    if (!quickIngredientId) return
    const qty = Number(quickQty)
    if (!Number.isFinite(qty) || qty <= 0) {
      setError('Enter a valid quantity for quick add.')
      return
    }
    setLines(dedupeLines([...lines, { ingredientId: Number(quickIngredientId), quantityPerUnit: qty }]))
    setQuickIngredientId('')
    setQuickQty('1')
    setError('')
    setCopyMessage('Ingredient added. Click Save production recipe when done.')
  }

  const saveRecipe = async () => {
    if (!productId) return

    const normalizedLines = dedupeLines(lines)
    if (normalizedLines.length === 0 && lines.length > 0) {
      setError('Every recipe line needs a raw material and a quantity greater than zero.')
      return
    }

    if (normalizedLines.some((line) => !line.ingredientId || Number(line.quantityPerUnit) <= 0)) {
      setError('Every recipe line needs a raw material and a quantity greater than zero.')
      return
    }

    setSaving(true)
    setError('')
    setCopyMessage('')
    try {
      const res = await fetch(`/api/products/${productId}/recipe`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ lines: normalizedLines })
      })
      if (!res.ok) throw new Error(await getErrorMessage(res, 'Could not save production recipe.'))
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['recipe', productId] }),
        qc.invalidateQueries({ queryKey: ['products'] })
      ])
      setLines(normalizedLines)
      setCopyMessage('Recipe saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save recipe')
    } finally {
      setSaving(false)
    }
  }

  function recipeStatus(product: Product) {
    const lineCount = Number(product.recipe_line_count ?? 0)
    if (lineCount > 0) return `${lineCount} ingredient${lineCount === 1 ? '' : 's'}`
    return 'No recipe yet'
  }

  return (
    <div className="card">
      <div className="mb-4">
        <h2 className="font-display text-xl font-black text-earth-950">Production Recipes</h2>
        <p className="text-sm text-earth-500 mt-1">
          All finished goods are listed below. Select any product to view or edit its recipe.
        </p>
      </div>

      {productList.length === 0 ? (
        <div className="rounded-xl border border-dashed border-earth-200 p-6 text-sm text-earth-500">
          No finished goods yet. Create a product first, then define its recipe here.
        </div>
      ) : (
        <div className="mb-5 flex flex-wrap gap-2">
          {productList.map((product) => {
            const active = product.id === productId
            const hasRecipe = Number(product.recipe_line_count ?? 0) > 0

            return (
              <button
                key={product.id}
                type="button"
                onClick={() => onProductSelect?.(product.id)}
                className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                  active
                    ? 'border-spice-500 bg-spice-50 shadow-sm ring-2 ring-spice-200'
                    : 'border-earth-200 bg-white hover:border-spice-300 hover:bg-spice-50/40'
                }`}
              >
                <div className="font-bold text-earth-950">{product.name}</div>
                <div className={`text-xs mt-0.5 ${hasRecipe ? 'text-green-700' : 'text-amber-700'}`}>
                  {recipeStatus(product)}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {!productId ? (
        <div className="rounded-xl border border-dashed border-earth-200 p-6 text-sm text-earth-500">
          Select a finished good above to edit its production recipe.
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4 border-t border-earth-100 pt-4">
            <div>
              <h3 className="font-display text-lg font-black text-earth-950">Recipe for {productName ?? 'selected product'}</h3>
              <p className="text-sm text-earth-500">Raw materials used to produce one unit.</p>
            </div>
            <div className="rounded-xl bg-spice-50 px-3 py-2 text-sm text-spice-800">
              Material cost: <span className="font-semibold">{materialCost.toFixed(2)} ETB</span>
            </div>
          </div>

          {recipe.isFetching ? (
            <div className="rounded-xl border border-earth-100 bg-earth-50 p-6 text-sm text-earth-500">Loading recipe…</div>
          ) : (
            <>
              {copyableProducts.length > 0 && (
                <div className="mb-4 flex flex-col gap-2 rounded-xl border border-spice-200 bg-spice-50/60 p-3 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-bold uppercase tracking-wide text-earth-600 mb-1">
                      Copy recipe from another product
                    </label>
                    <select
                      className="input-field"
                      value={copyFromId}
                      onChange={(event) => setCopyFromId(event.target.value ? Number(event.target.value) : '')}
                    >
                      <option value="">Select product with recipe…</option>
                      {copyableProducts.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} ({product.recipe_line_count} lines)
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    className="btn-primary"
                    type="button"
                    disabled={!copyFromId}
                    onClick={() => copyFromId && copyRecipeFrom(copyFromId)}
                  >
                    Copy recipe
                  </button>
                </div>
              )}

              {copyableProducts.length === 0 && productList.length > 1 && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  No other products have a saved recipe yet. Save a recipe on one product first, then you can copy it to the others.
                </div>
              )}

              <div className="mb-4 flex flex-col gap-2 rounded-xl border border-earth-100 bg-earth-50/60 p-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label className="block text-xs font-bold uppercase tracking-wide text-earth-600 mb-1">Quick add ingredient</label>
                  <select
                    className="input-field"
                    value={quickIngredientId}
                    onChange={(event) => setQuickIngredientId(event.target.value ? Number(event.target.value) : '')}
                  >
                    <option value="">Choose raw material…</option>
                    {ingredientList.map((item) => (
                      <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>
                    ))}
                  </select>
                </div>
                <div className="w-28">
                  <label className="block text-xs font-bold uppercase tracking-wide text-earth-600 mb-1">Qty / unit</label>
                  <input
                    className="input-field"
                    type="number"
                    step="0.001"
                    min="0"
                    value={quickQty}
                    onChange={(event) => setQuickQty(event.target.value)}
                  />
                </div>
                <button type="button" className="btn-secondary" onClick={quickAddIngredient} disabled={ingredientList.length === 0}>
                  + Add
                </button>
              </div>

              <div className="space-y-3">
                {lines.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-earth-200 p-4 text-sm text-earth-500">
                    No ingredients in this recipe yet. Use quick add or add a recipe line below.
                  </div>
                ) : (
                  lines.map((line, index) => {
                    const ingredient = ingredientList.find((item) => item.id === line.ingredientId)

                    return (
                      <div key={`${line.ingredientId}-${index}`} className="grid grid-cols-1 gap-2 rounded-xl border border-earth-100 bg-earth-50/60 p-3 sm:grid-cols-[1fr_140px_80px]">
                        <select
                          className="input-field"
                          value={line.ingredientId || ''}
                          onChange={(event) => {
                            const next = [...lines]
                            next[index] = { ...line, ingredientId: Number(event.target.value) }
                            setLines(dedupeLines(next))
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
                          placeholder="Qty per unit"
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
                  })
                )}
              </div>

              {error && <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{error}</div>}
              {copyMessage && <div className="mt-3 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">{copyMessage}</div>}

              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  className="btn-secondary"
                  type="button"
                  disabled={ingredientList.length === 0}
                  onClick={() => {
                    const firstId = ingredientList[0]?.id
                    if (!firstId) {
                      setError('Add raw materials first before building a recipe.')
                      return
                    }
                    setLines([...lines, { ingredientId: firstId, quantityPerUnit: 0.001 }])
                  }}
                >
                  Add recipe line
                </button>
                <button
                  className="btn-primary"
                  type="button"
                  disabled={saving || recipe.isFetching || hasInvalidLines}
                  onClick={saveRecipe}
                >
                  {saving ? 'Saving...' : 'Save production recipe'}
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
