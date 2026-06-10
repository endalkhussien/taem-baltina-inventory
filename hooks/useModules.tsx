"use client"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export type Ingredient = { id: number; name: string; quantity: number; unit: string; cost_per_unit: number; alert_threshold: number }

export function useIngredients() {
  const qc = useQueryClient()
  const query = useQuery<Ingredient[]>({ queryKey: ['ingredients'], queryFn: async () => { const res = await fetch('/api/ingredients'); if (!res.ok) throw new Error('Failed'); return res.json() } })
  const create = useMutation({ mutationFn: async (data: any) => { const res = await fetch('/api/ingredients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); if (!res.ok) throw new Error('Create failed'); return res.json() }, onSuccess: () => qc.invalidateQueries({ queryKey: ['ingredients'] }) })
  const update = useMutation({ mutationFn: async ({ id, data }: any) => { const res = await fetch(`/api/ingredients/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); if (!res.ok) throw new Error('Update failed'); return res.json() }, onSuccess: () => qc.invalidateQueries({ queryKey: ['ingredients'] }) })
  return { ...query, createIngredient: (d: any) => create.mutateAsync(d), updateIngredient: (id: number, d: any) => update.mutateAsync({ id, data: d }), deleteIngredient: async (id: number) => { const res = await fetch(`/api/ingredients/${id}`, { method: 'DELETE' }); if (!res.ok) throw new Error('Delete failed'); qc.invalidateQueries({ queryKey: ['ingredients'] }) } }
}

export type Sale = { id: number; sale_code: string; product_id: number; quantity: number; unit_price: number; total_amount: number; amount_paid: number; balance: number; payment_status: string }

export function useSales() {
  const qc = useQueryClient()
  const query = useQuery<Sale[]>({ queryKey: ['sales'], queryFn: async () => { const res = await fetch('/api/sales'); if (!res.ok) throw new Error('Failed'); return res.json() } })
  const create = useMutation({ mutationFn: async (data: any) => { const res = await fetch('/api/sales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); if (!res.ok) throw new Error('Create failed'); return res.json() }, onSuccess: () => { qc.invalidateQueries({ queryKey: ['sales'] }); qc.invalidateQueries({ queryKey: ['products'] }) } })
  return { ...query, createSale: (d: any) => create.mutateAsync(d), deleteSale: async (id: number) => { const res = await fetch(`/api/sales/${id}`, { method: 'DELETE' }); if (!res.ok) throw new Error('Delete failed'); qc.invalidateQueries({ queryKey: ['sales'] }); qc.invalidateQueries({ queryKey: ['products'] }) } }
}

export type Expense = { id: number; title: string; category: string; amount: number; notes?: string }

export function useExpenses() {
  const qc = useQueryClient()
  const query = useQuery<Expense[]>({ queryKey: ['expenses'], queryFn: async () => { const res = await fetch('/api/expenses'); if (!res.ok) throw new Error('Failed'); return res.json() } })
  const create = useMutation({ mutationFn: async (data: any) => { const res = await fetch('/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); if (!res.ok) throw new Error('Create failed'); return res.json() }, onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }) })
  const update = useMutation({ mutationFn: async ({ id, data }: any) => { const res = await fetch(`/api/expenses/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); if (!res.ok) throw new Error('Update failed'); return res.json() }, onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }) })
  return { ...query, createExpense: (d: any) => create.mutateAsync(d), updateExpense: (id: number, d: any) => update.mutateAsync({ id, data: d }), deleteExpense: async (id: number) => { await fetch(`/api/expenses/${id}`, { method: 'DELETE' }); qc.invalidateQueries({ queryKey: ['expenses'] }) } }
}
