"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export type Product = {
  id: number
  name: string
  selling_price: string
  stock_quantity: number
  alert_threshold: number
}

export function useProducts() {
  const qc = useQueryClient()

  const query = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await fetch('/api/products')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    }
  })

  const create = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Create failed')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] })
  })

  const update = useMutation({
    mutationFn: async ({ id, data }: any) => {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Update failed')
      return res.json()
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] })
  })

  return {
    ...query,
    createProduct: (d: any) => create.mutateAsync(d),
    updateProduct: (id: number, d: any) => update.mutateAsync({ id, data: d }),
    deleteProduct: async (id: number) => {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      qc.invalidateQueries({ queryKey: ['products'] })
    }
  }
}
