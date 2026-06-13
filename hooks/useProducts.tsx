"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export type Product = {
  id: number
  name: string
  selling_price: number
  stock_quantity: number
  alert_threshold: number
  recipe_line_count?: number
}

async function getErrorMessage(res: Response, fallback: string) {
  try {
    const body = await res.json()
    if (typeof body?.error === 'string') return body.error
    if (body?.error) return JSON.stringify(body.error)
  } catch {
    // The response was not JSON; use the generic message below.
  }

  return fallback
}

export function useProducts() {
  const qc = useQueryClient()

  const query = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch('/api/products', { credentials: 'same-origin' })
      if (!res.ok) throw new Error(await getErrorMessage(res, 'Failed to fetch finished goods.'))
      return res.json()
    }
  })

  const create = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error(await getErrorMessage(res, 'Could not create finished good.'))
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] })
  })

  const update = useMutation({
    mutationFn: async ({ id, data }: any) => {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error(await getErrorMessage(res, 'Could not update finished good.'))
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] })
  })

  return {
    ...query,
    createProduct: (d: any) => create.mutateAsync(d),
    updateProduct: (id: number, d: any) => update.mutateAsync({ id, data: d }),
    isCreatingProduct: create.isPending,
    isUpdatingProduct: update.isPending,
    deleteProduct: async (id: number) => {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE', credentials: 'same-origin' })
      if (!res.ok) throw new Error(await getErrorMessage(res, 'Could not delete finished good.'))
      qc.invalidateQueries({ queryKey: ['products'] })
    }
  }
}
