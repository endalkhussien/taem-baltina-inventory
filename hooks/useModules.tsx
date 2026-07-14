"use client"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export type Ingredient = { id: number; name: string; category: string; quantity: number; unit: string; cost_per_unit: number; alert_threshold: number }
export type Purchase = { id: number; ingredient_id: number; ingredient_name: string | null; quantity: number; cost_total: number; supplier?: string | null; purchase_date: string }
export type Customer = { id: number; name: string; phone?: string | null; notes?: string | null; outstanding_balance: number; ledger_balance?: number; total_credit?: number }
export type ProductionBatch = {
  id: number
  product_id: number
  product_name: string | null
  batch_count: number
  quantity_produced: number
  material_cost: number
  labor_cost: number
  equipment_cost: number
  other_overhead: number
  total_cost: number
  cost_per_unit: number
  produced_at: string
  notes?: string | null
  stock_kg_before?: number
  stock_kg_after?: number
  quantity_added_kg?: number
}
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

async function apiRequest<T>(url: string, options: RequestInit = {}, fallback: string): Promise<T> {
  const res = await fetch(url, {
    credentials: 'same-origin',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers
    }
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res, fallback))
  }

  return res.json()
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>, queryKeys: string[]) {
  return Promise.all(queryKeys.map((queryKey) => qc.invalidateQueries({ queryKey: [queryKey] })))
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
  const query = useQuery<Purchase[]>({ queryKey: ['purchases'], queryFn: () => apiRequest<Purchase[]>('/api/purchases', {}, 'Failed to load raw-material purchases.') })
  const create = useMutation({
    mutationFn: (data: any) => apiRequest<Purchase>('/api/purchases', { method: 'POST', body: JSON.stringify(data) }, 'Could not record purchase.'),
    onSuccess: () => invalidateAll(qc, ['purchases', 'ingredients'])
  })
  return { ...query, createPurchase: (d: any) => create.mutateAsync(d), isCreatingPurchase: create.isPending }
}

export type Sale = { id: number; sale_code: string; product_id: number; product_name?: string | null; customer_id?: number | null; customer_name?: string | null; quantity: number; unit_price: number; total_amount: number; amount_paid: number; balance: number; payment_status: string; sale_date: string; stock_kg_before?: number; stock_kg_after?: number; quantity_sold_kg?: number }

export function useSales() {
  const qc = useQueryClient()
  const query = useQuery<Sale[]>({ queryKey: ['sales'], queryFn: () => apiRequest<Sale[]>('/api/sales', {}, 'Failed to load sales.') })
  const create = useMutation({ mutationFn: (data: any) => apiRequest<Sale>('/api/sales', { method: 'POST', body: JSON.stringify(data) }, 'Could not record sale.'), onSuccess: () => invalidateAll(qc, ['sales', 'products', 'customers']) })
  return { ...query, createSale: (d: any) => create.mutateAsync(d), isCreatingSale: create.isPending, deleteSale: async (id: number) => { await apiRequest(`/api/sales/${id}`, { method: 'DELETE' }, 'Could not delete sale.'); invalidateAll(qc, ['sales', 'products', 'customers', 'repayments']) } }
}

export function useRepayments() {
  const qc = useQueryClient()
  const query = useQuery<Repayment[]>({ queryKey: ['repayments'], queryFn: () => apiRequest<Repayment[]>('/api/repayments', {}, 'Failed to load repayments.') })
  const create = useMutation({
    mutationFn: (data: any) => apiRequest<Repayment>('/api/repayments', { method: 'POST', body: JSON.stringify(data) }, 'Could not record payment.'),
    onSuccess: () => invalidateAll(qc, ['repayments', 'sales', 'customers'])
  })
  return { ...query, createRepayment: (d: any) => create.mutateAsync(d), isCreatingRepayment: create.isPending }
}

export function useCustomers() {
  const qc = useQueryClient()
  const query = useQuery<Customer[]>({ queryKey: ['customers'], queryFn: () => apiRequest<Customer[]>('/api/customers', {}, 'Failed to load customer accounts.') })
  const create = useMutation({ mutationFn: (data: any) => apiRequest<Customer>('/api/customers', { method: 'POST', body: JSON.stringify(data) }, 'Could not create customer account.'), onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }) })
  const update = useMutation({ mutationFn: ({ id, data }: any) => apiRequest<Customer>(`/api/customers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, 'Could not update customer account.'), onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }) })
  return { ...query, createCustomer: (d: any) => create.mutateAsync(d), updateCustomer: (id: number, d: any) => update.mutateAsync({ id, data: d }), isCreatingCustomer: create.isPending, isUpdatingCustomer: update.isPending, deleteCustomer: async (id: number) => { await apiRequest(`/api/customers/${id}`, { method: 'DELETE' }, 'Could not delete customer account.'); qc.invalidateQueries({ queryKey: ['customers'] }) } }
}

export function useProduction() {
  const qc = useQueryClient()
  const query = useQuery<ProductionBatch[]>({ queryKey: ['production'], queryFn: () => apiRequest<ProductionBatch[]>('/api/production', {}, 'Failed to load production batches.') })
  const create = useMutation({
    mutationFn: (data: any) => apiRequest<ProductionBatch>('/api/production', { method: 'POST', body: JSON.stringify(data) }, 'Could not post production batch.'),
    onSuccess: () => invalidateAll(qc, ['production', 'ingredients', 'products'])
  })
  return { ...query, createProduction: (d: any) => create.mutateAsync(d), isCreatingProduction: create.isPending }
}

export type Expense = { id: number; title: string; category: string; amount: number; expense_date?: string; notes?: string }

export function useExpenses() {
  const qc = useQueryClient()
  const query = useQuery<Expense[]>({ queryKey: ['expenses'], queryFn: () => apiRequest<Expense[]>('/api/expenses', {}, 'Failed to load operating costs.') })
  const create = useMutation({ mutationFn: (data: any) => apiRequest<Expense>('/api/expenses', { method: 'POST', body: JSON.stringify(data) }, 'Could not record operating cost.'), onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }) })
  const update = useMutation({ mutationFn: ({ id, data }: any) => apiRequest<Expense>(`/api/expenses/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, 'Could not update operating cost.'), onSuccess: () => qc.invalidateQueries({ queryKey: ['expenses'] }) })
  return { ...query, createExpense: (d: any) => create.mutateAsync(d), updateExpense: (id: number, d: any) => update.mutateAsync({ id, data: d }), isCreatingExpense: create.isPending, isUpdatingExpense: update.isPending, deleteExpense: async (id: number) => { await apiRequest(`/api/expenses/${id}`, { method: 'DELETE' }, 'Could not delete operating cost.'); qc.invalidateQueries({ queryKey: ['expenses'] }) } }
}

export type CashEntry = { id: number; amount: number; notes?: string | null; entry_date: string; created_at: string }
export type Liability = { id: number; creditor_name: string; category: string; title: string; total_amount: number; amount_paid: number; balance: number; liability_date: string; notes?: string | null }
export type LiabilityPayment = { id: number; liability_id: number; creditor_name?: string | null; title?: string | null; amount: number; payment_date: string; notes?: string | null }

export function useCashEntries() {
  const qc = useQueryClient()
  const query = useQuery<CashEntry[]>({ queryKey: ['cashEntries'], queryFn: () => apiRequest<CashEntry[]>('/api/cash-entries', {}, 'Failed to load cash entries.') })
  const create = useMutation({
    mutationFn: (data: any) => apiRequest<CashEntry>('/api/cash-entries', { method: 'POST', body: JSON.stringify(data) }, 'Could not record cash on hand.'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cashEntries'] })
  })
  return { ...query, createCashEntry: (d: any) => create.mutateAsync(d), isCreatingCashEntry: create.isPending }
}

export function useLiabilities() {
  const qc = useQueryClient()
  const query = useQuery<Liability[]>({ queryKey: ['liabilities'], queryFn: () => apiRequest<Liability[]>('/api/liabilities', {}, 'Failed to load liabilities.') })
  const create = useMutation({
    mutationFn: (data: any) => apiRequest<Liability>('/api/liabilities', { method: 'POST', body: JSON.stringify(data) }, 'Could not record liability.'),
    onSuccess: () => invalidateAll(qc, ['liabilities', 'liabilityPayments'])
  })
  return {
    ...query,
    createLiability: (d: any) => create.mutateAsync(d),
    isCreatingLiability: create.isPending,
    deleteLiability: async (id: number) => {
      await apiRequest(`/api/liabilities/${id}`, { method: 'DELETE' }, 'Could not delete liability.')
      invalidateAll(qc, ['liabilities', 'liabilityPayments'])
    }
  }
}

export function useLiabilityPayments() {
  const qc = useQueryClient()
  const query = useQuery<LiabilityPayment[]>({ queryKey: ['liabilityPayments'], queryFn: () => apiRequest<LiabilityPayment[]>('/api/liability-payments', {}, 'Failed to load liability payments.') })
  const create = useMutation({
    mutationFn: (data: any) => apiRequest<LiabilityPayment>('/api/liability-payments', { method: 'POST', body: JSON.stringify(data) }, 'Could not record liability payment.'),
    onSuccess: () => invalidateAll(qc, ['liabilityPayments', 'liabilities'])
  })
  return { ...query, createLiabilityPayment: (d: any) => create.mutateAsync(d), isCreatingLiabilityPayment: create.isPending }
}

export type CreditLedger = {
  id: number
  customer_id: number
  customer_name?: string | null
  title: string
  total_amount: number
  amount_paid: number
  balance: number
  credit_date: string
  notes?: string | null
}

export type CreditPayment = {
  id: number
  credit_id: number
  customer_name?: string | null
  credit_title?: string | null
  amount: number
  payment_date: string
  notes?: string | null
}

export function useCreditLedgers() {
  const qc = useQueryClient()
  const query = useQuery<CreditLedger[]>({
    queryKey: ['creditLedgers'],
    queryFn: () => apiRequest<CreditLedger[]>('/api/credit-ledgers', {}, 'Failed to load credit ledger.')
  })
  const create = useMutation({
    mutationFn: (data: any) => apiRequest<CreditLedger>('/api/credit-ledgers', { method: 'POST', body: JSON.stringify(data) }, 'Could not record credit.'),
    onSuccess: async (created) => {
      qc.setQueryData<CreditLedger[]>(['creditLedgers'], (current) => {
        const list = Array.isArray(current) ? current : []
        const withoutDuplicate = list.filter((row) => row.id !== created.id)
        return [created, ...withoutDuplicate]
      })
      await invalidateAll(qc, ['creditLedgers', 'creditPayments', 'customers'])
    }
  })
  return {
    ...query,
    createCreditLedger: (d: any) => create.mutateAsync(d),
    isCreatingCreditLedger: create.isPending,
    deleteCreditLedger: async (id: number) => {
      await apiRequest(`/api/credit-ledgers/${id}`, { method: 'DELETE' }, 'Could not delete credit entry.')
      await invalidateAll(qc, ['creditLedgers', 'creditPayments', 'customers'])
    }
  }
}

export function useCreditPayments() {
  const qc = useQueryClient()
  const query = useQuery<CreditPayment[]>({
    queryKey: ['creditPayments'],
    queryFn: () => apiRequest<CreditPayment[]>('/api/credit-payments', {}, 'Failed to load credit payments.')
  })
  const create = useMutation({
    mutationFn: (data: any) => apiRequest<CreditPayment>('/api/credit-payments', { method: 'POST', body: JSON.stringify(data) }, 'Could not record credit payment.'),
    onSuccess: () => invalidateAll(qc, ['creditPayments', 'creditLedgers', 'customers'])
  })
  return { ...query, createCreditPayment: (d: any) => create.mutateAsync(d), isCreatingCreditPayment: create.isPending }
}
