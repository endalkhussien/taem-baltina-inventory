"use client"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export type Ingredient = { id: number; name: string; quantity: number; unit: string; cost_per_unit: number; alert_threshold: number }
export type Purchase = { id: number; ingredient_id: number; ingredient_name: string | null; quantity: number; cost_total: number; supplier?: string | null; purchase_date: string }
export type Customer = { id: number; name: string; phone?: string | null; notes?: string | null; outstanding_balance: number }
export type ProductionBatch = { id: number; product_id: number; product_name: string | null; quantity_produced: number; produced_at: string; notes?: string | null }
export type Repayment = { id: number; sale_id: number; sale_code: string | null; amount: number; payment_date: string }

async function getErrorMessage(res: Response, fallback: string) {
  try {
    const body = await res.json()
    if (typeof body?.error === 'string') return body.error
    if (body?.error) return JSON.stringify(body.error)
  } catch {
    // Response was not JSON.
  }

  return fallback
}

export function useIngredients() {
  const qc = useQueryClient()
  const query = useQuery<Ingredient[]>({ queryKey: ['ingredients'], queryFn: async () => { const res = await fetch('/api/ingredients', { credentials: 'same-origin' }); if (!res.ok) throw new Error(await getErrorMessage(res, 'Failed to load raw materials.')); return res.json() } })
  const create = useMutation({ mutationFn: async (data: any) => { const res = await fetch('/api/ingredients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(data) }); if (!res.ok) throw new Error(await getErrorMessage(res, 'Could not create raw material.')); return res.json() }, onSuccess: () => qc.invalidateQueries({ queryKey: ['ingredients'] }) })
  const update = useMutation({ mutationFn: async ({ id, data }: any) => { const res = await fetch(`/api/ingredients/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(data) }); if (!res.ok) throw new Error(await getErrorMessage(res, 'Could not update raw material.')); return res.json() }, onSuccess: () => qc.invalidateQueries({ queryKey: ['ingredients'] }) })
  return { ...query, createIngredient: (d: any) => create.mutateAsync(d), updateIngredient: (id: number, d: any) => update.mutateAsync({ id, data: d }), isCreatingIngredient: create.isPending, isUpdatingIngredient: update.isPending, deleteIngredient: async (id: number) => { const res = await fetch(`/api/ingredients/${id}`, { method: 'DELETE', credentials: 'same-origin' }); if (!res.ok) throw new Error(await getErrorMessage(res, 'Could not delete raw material.')); qc.invalidateQueries({ queryKey: ['ingredients'] }) } }
}

export function usePurchases() {
  const qc = useQueryClient()
  const query = useQuery<Purchase[]>({ queryKey: ['purchases'], queryFn: async () => { const res = await fetch('/api/purchases'); if (!res.ok) throw new Error('Failed'); return res.json() } })
  const create = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/purchases', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (!res.ok) throw new Error('Purchase failed')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchases'] })
      qc.invalidateQueries({ queryKey: ['ingredients'] })
    }
  })
  return { ...query, createPurchase: (d: any) => create.mutateAsync(d) }
}

export type Sale = { id: number; sale_code: string; product_id: number; product_name?: string | null; customer_id?: number | null; customer_name?: string | null; quantity: number; unit_price: number; total_amount: number; amount_paid: number; balance: number; payment_status: string; sale_date: string }

export function useSales() {
  const qc = useQueryClient()
  const query = useQuery<Sale[]>({ queryKey: ['sales'], queryFn: async () => { const res = await fetch('/api/sales'); if (!res.ok) throw new Error('Failed'); return res.json() } })
  const create = useMutation({ mutationFn: async (data: any) => { const res = await fetch('/api/sales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); if (!res.ok) throw new Error('Create failed'); return res.json() }, onSuccess: () => { qc.invalidateQueries({ queryKey: ['sales'] }); qc.invalidateQueries({ queryKey: ['products'] }); qc.invalidateQueries({ queryKey: ['customers'] }) } })
  return { ...query, createSale: (d: any) => create.mutateAsync(d), deleteSale: async (id: number) => { const res = await fetch(`/api/sales/${id}`, { method: 'DELETE' }); if (!res.ok) throw new Error('Delete failed'); qc.invalidateQueries({ queryKey: ['sales'] }); qc.invalidateQueries({ queryKey: ['products'] }); qc.invalidateQueries({ queryKey: ['customers'] }) } }
}

export function useRepayments() {
  const qc = useQueryClient()
  const query = useQuery<Repayment[]>({ queryKey: ['repayments'], queryFn: async () => { const res = await fetch('/api/repayments'); if (!res.ok) throw new Error('Failed'); return res.json() } })
  const create = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/repayments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (!res.ok) throw new Error('Payment failed')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['repayments'] })
      qc.invalidateQueries({ queryKey: ['sales'] })
      qc.invalidateQueries({ queryKey: ['customers'] })
    }
  })
  return { ...query, createRepayment: (d: any) => create.mutateAsync(d) }
}

export function useCustomers() {
  const qc = useQueryClient()
  const query = useQuery<Customer[]>({ queryKey: ['customers'], queryFn: async () => { const res = await fetch('/api/customers'); if (!res.ok) throw new Error('Failed'); return res.json() } })
  const create = useMutation({ mutationFn: async (data: any) => { const res = await fetch('/api/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); if (!res.ok) throw new Error('Create failed'); return res.json() }, onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }) })
  const update = useMutation({ mutationFn: async ({ id, data }: any) => { const res = await fetch(`/api/customers/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); if (!res.ok) throw new Error('Update failed'); return res.json() }, onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }) })
  return { ...query, createCustomer: (d: any) => create.mutateAsync(d), updateCustomer: (id: number, d: any) => update.mutateAsync({ id, data: d }), deleteCustomer: async (id: number) => { const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' }); if (!res.ok) throw new Error('Delete failed'); qc.invalidateQueries({ queryKey: ['customers'] }) } }
}

export function useProduction() {
  const qc = useQueryClient()
  const query = useQuery<ProductionBatch[]>({ queryKey: ['production'], queryFn: async () => { const res = await fetch('/api/production'); if (!res.ok) throw new Error('Failed'); return res.json() } })
  const create = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/production', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      if (!res.ok) throw new Error('Production failed')
      return res.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['production'] })
      qc.invalidateQueries({ queryKey: ['ingredients'] })
      qc.invalidateQueries({ queryKey: ['products'] })
    }
  })
  return { ...query, createProduction: (d: any) => create.mutateAsync(d) }
}

export type Expense = { id: number; title: string; category: string; amount: number; notes?: string }

export function useExpenses() {
  const qc = useQueryClient()
  const query = useQuery<Expense[]>({ queryKey: ['expenses'], queryFn: async () => { const res = await fetch('/api/expenses'); if (!res.ok) throw new Error('Failed'); return res.json() } })
  const create = useMutation({ mutationFn: async (data: any) => { const res = await fetch('/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); if (!res.ok) throw new Error('Create failed'); return res.json() }, onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }) })
  const update = useMutation({ mutationFn: async ({ id, data }: any) => { const res = await fetch(`/api/expenses/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); if (!res.ok) throw new Error('Update failed'); return res.json() }, onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }) })
  return { ...query, createExpense: (d: any) => create.mutateAsync(d), updateExpense: (id: number, d: any) => update.mutateAsync({ id, data: d }), deleteExpense: async (id: number) => { await fetch(`/api/expenses/${id}`, { method: 'DELETE' }); qc.invalidateQueries({ queryKey: ['expenses'] }) } }
}
