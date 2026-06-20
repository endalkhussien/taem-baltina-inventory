"use client"

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useProducts } from '../../../hooks/useProducts'
import { useCustomers, useRepayments, useSales } from '../../../hooks/useModules'
import AdminNav from '../../../components/AdminNav'
import { computeSaleTotals, toLocalDateKey } from '../../../lib/sales'
import { formatStockKg } from '../../../lib/productStock'
import { isInSalesPeriod, salesPeriodLabels, summarizeSales, type SalesPeriod } from '../../../lib/periods'

const today = new Date().toISOString().slice(0, 10)

type SaleFormValues = {
  productId: number
  customerId: number
  quantity: number
  amountPaid: number
  saleDate: string
}

export default function SalesPage() {
  const { data: products } = useProducts()
  const { data: customers } = useCustomers()
  const { data: sales, isLoading: sLoading, createSale, isCreatingSale, deleteSale } = useSales()
  const { data: repayments, createRepayment, isCreatingRepayment } = useRepayments()
  const [filterDate, setFilterDate] = useState(today)
  const [salesPeriod, setSalesPeriod] = useState<SalesPeriod>('week')
  const [openCreditOnly, setOpenCreditOnly] = useState(false)
  const [repaySaleId, setRepaySaleId] = useState<number | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const previousCustomerId = useRef(0)

  const { register, handleSubmit, reset, watch, setValue } = useForm<SaleFormValues>({
    defaultValues: { productId: 0, customerId: 0, quantity: 1, amountPaid: 0, saleDate: today }
  })
  const { register: registerRepayment, handleSubmit: handleRepaymentSubmit, reset: resetRepayment } = useForm({
    defaultValues: { amount: 0, paymentDate: today }
  })

  const selectedProductId = Number(watch('productId') || 0)
  const customerId = Number(watch('customerId') || 0)
  const quantity = Number(watch('quantity') || 0)
  const amountPaid = Number(watch('amountPaid') || 0)

  const productList = useMemo(() => (Array.isArray(products) ? products : []), [products])
  const customerList = useMemo(() => (Array.isArray(customers) ? customers : []), [customers])
  const salesList = useMemo(() => (Array.isArray(sales) ? sales : []), [sales])
  const repaymentList = Array.isArray(repayments) ? repayments : []

  const selectedProduct = productList.find((product) => product.id === selectedProductId) ?? null
  const unitPrice = selectedProduct ? Number(selectedProduct.selling_price) : 0
  const availableStock = selectedProduct ? Number(selectedProduct.stock_quantity) : 0
  const isCreditSale = customerId > 0
  const effectiveAmountPaid = isCreditSale ? amountPaid : unitPrice * quantity
  const { total: saleTotal, balance: saleBalance, status: saleStatus } = computeSaleTotals(
    quantity,
    unitPrice,
    effectiveAmountPaid
  )

  const periodSales = useMemo(
    () => salesList.filter((sale) => isInSalesPeriod(sale.sale_date, salesPeriod, filterDate)),
    [filterDate, salesList, salesPeriod]
  )
  const openCreditSales = useMemo(
    () => salesList.filter((sale) => Number(sale.balance) > 0),
    [salesList]
  )
  const tableSales = openCreditOnly ? openCreditSales : periodSales
  const periodSummary = useMemo(() => summarizeSales(periodSales), [periodSales])

  const totalOutstanding = openCreditSales.reduce((sum, sale) => sum + Number(sale.balance), 0)

  const selectedRepaySale = salesList.find((sale) => sale.id === repaySaleId) ?? null
  const stockError =
    selectedProduct && quantity > 0 && quantity > availableStock
      ? `Only ${formatStockKg(availableStock)} of ${selectedProduct.name} available.`
      : selectedProduct && availableStock <= 0
        ? `${selectedProduct.name} is out of stock.`
        : ''
  const projectedStockKg = Math.max(availableStock - quantity, 0)

  useEffect(() => {
    if (!selectedProduct) return
    if (quantity > availableStock && availableStock > 0) {
      setValue('quantity', availableStock)
    }
    if (availableStock <= 0) {
      setValue('quantity', 0)
    }
  }, [availableStock, quantity, selectedProduct, setValue])

  useEffect(() => {
    const nextTotal = computeSaleTotals(quantity, unitPrice, 0).total

    if (customerId === 0) {
      setValue('amountPaid', nextTotal)
    } else if (previousCustomerId.current === 0) {
      setValue('amountPaid', 0)
    }

    previousCustomerId.current = customerId
  }, [customerId, quantity, unitPrice, setValue])

  const onSubmit = async (values: SaleFormValues) => {
    setMessage(null)

    const product = productList.find((item) => item.id === values.productId)
    if (!product) {
      setMessage({ type: 'error', text: 'Select a finished good to sell.' })
      return
    }

    if (Number(product.stock_quantity) <= 0) {
      setMessage({ type: 'error', text: `${product.name} is out of stock. Produce or restock before selling.` })
      return
    }

    if (values.quantity <= 0) {
      setMessage({ type: 'error', text: 'Enter a quantity greater than zero.' })
      return
    }

    if (values.quantity > Number(product.stock_quantity)) {
      setMessage({
        type: 'error',
        text: `Not enough stock. Only ${formatStockKg(product.stock_quantity)} available.`
      })
      return
    }

    const totals = computeSaleTotals(values.quantity, Number(product.selling_price), values.customerId > 0 ? values.amountPaid : values.quantity * Number(product.selling_price))

    if (values.customerId === 0 && totals.balance > 0) {
      setMessage({ type: 'error', text: 'Walk-in sales must be paid in full. Select a customer for credit.' })
      return
    }

    if (totals.balance > 0 && values.customerId === 0) {
      setMessage({ type: 'error', text: 'Credit or partial sales must use a customer account.' })
      return
    }

    if (totals.paid > totals.total) {
      setMessage({ type: 'error', text: 'Amount paid cannot be more than the sale total.' })
      return
    }

    try {
      const result = await createSale({
        productId: values.productId,
        customerId: values.customerId,
        quantity: values.quantity,
        amountPaid: totals.paid,
        saleDate: values.saleDate
      })
      reset({ productId: 0, customerId: 0, quantity: 1, amountPaid: 0, saleDate: today })
      previousCustomerId.current = 0
      const afterKg = Number(result.stock_kg_after ?? 0)
      const soldKg = Number(result.quantity_sold_kg ?? values.quantity)
      setMessage({
        type: 'success',
        text: `Sale recorded: −${soldKg} kg sold. Remaining stock: ${afterKg} kg.`
      })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Could not record sale.' })
    }
  }

  const onRepaymentSubmit = async (vals: any) => {
    if (!repaySaleId) return
    setMessage(null)
    try {
      await createRepayment({ saleId: repaySaleId, ...vals })
      setRepaySaleId(null)
      resetRepayment({ amount: 0, paymentDate: today })
      setMessage({ type: 'success', text: 'Payment recorded and customer balance updated.' })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Could not record payment.' })
    }
  }

  const canSubmit =
    !isCreatingSale &&
    selectedProductId > 0 &&
    quantity > 0 &&
    !stockError &&
    availableStock > 0 &&
    (isCreditSale ? amountPaid <= saleTotal : true)

  return (
    <>
      <AdminNav />
      <div className="app-page">
        <div className="app-container">
          <div className="page-hero flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.28em] text-spice-200">Sales & credit desk</div>
              <h1 className="mt-3 font-display text-4xl font-black leading-tight sm:text-5xl">Daily Sales and Customer Credit</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-earth-100 sm:text-base">
                Price is taken from the product automatically. Walk-in sales are paid in full. Credit sales let you enter partial payment.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap rounded-2xl bg-white/10 p-1 ring-1 ring-white/15">
                {(['today', 'week', 'month', 'all'] as SalesPeriod[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setSalesPeriod(item)}
                    className={`rounded-xl px-3 py-2 text-xs font-black uppercase tracking-wide transition-colors ${salesPeriod === item ? 'bg-white text-earth-950' : 'text-earth-100 hover:bg-white/10'}`}
                  >
                    {salesPeriodLabels[item]}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
                  <div className="text-xs uppercase tracking-[0.16em] text-spice-100">Sales total</div>
                  <div className="text-xl font-black text-white">{periodSummary.revenue.toFixed(2)} ETB</div>
                  <div className="mt-1 text-[11px] text-spice-100">{periodSummary.count} sale{periodSummary.count === 1 ? '' : 's'}</div>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
                  <div className="text-xs uppercase tracking-[0.16em] text-spice-100">Cash collected</div>
                  <div className="text-xl font-black text-white">{periodSummary.cash.toFixed(2)} ETB</div>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
                  <div className="text-xs uppercase tracking-[0.16em] text-spice-100">Credit created</div>
                  <div className="text-xl font-black text-white">{periodSummary.credit.toFixed(2)} ETB</div>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
                  <div className="text-xs uppercase tracking-[0.16em] text-spice-100">Kg sold</div>
                  <div className="text-xl font-black text-white">{periodSummary.kg} kg</div>
                  <div className="mt-1 text-[11px] text-spice-100">Open credit all time: {totalOutstanding.toFixed(2)} ETB</div>
                </div>
              </div>
            </div>
          </div>

          {message && (
            <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${message.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card">
              <h2 className="font-display text-xl font-black text-earth-950 mb-1">Record Product Sale</h2>
              <p className="mb-5 text-sm text-earth-500">
                Total is calculated from quantity × selling price. For credit, choose a customer and enter how much was paid now.
              </p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-earth-700 mb-1.5">Sale Date</label>
                  <input type="date" className="input-field" {...register('saleDate')} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-earth-700 mb-1.5">Finished Good Sold</label>
                  <select className="input-field" {...register('productId', { valueAsNumber: true })}>
                    <option value={0}>Select product</option>
                    {productList.map((product) => {
                      const inStock = Number(product.stock_quantity) > 0
                      return (
                        <option key={product.id} value={product.id} disabled={!inStock}>
                          {product.name} ({formatStockKg(product.stock_quantity)}){inStock ? '' : ' — OUT OF STOCK'}
                        </option>
                      )
                    })}
                  </select>
                  {stockError && <p className="mt-2 text-sm font-semibold text-red-700">{stockError}</p>}
                </div>
                <div>
                  <label className="block text-sm font-bold text-earth-700 mb-1.5">Customer Account</label>
                  <select className="input-field" {...register('customerId', { valueAsNumber: true })}>
                    <option value={0}>Walk-in — full cash payment</option>
                    {customerList.map((customer) => (
                      <option key={customer.id} value={customer.id}>{customer.name}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-earth-500">
                    {isCreditSale
                      ? 'Credit sale: enter partial payment or leave 0 for full credit.'
                      : 'Walk-in sales are always paid in full automatically.'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-earth-700 mb-1.5">Quantity (kg)</label>
                    <input
                      type="number"
                      min={availableStock > 0 ? 1 : 0}
                      max={availableStock > 0 ? availableStock : 0}
                      className="input-field"
                      {...register('quantity', { valueAsNumber: true })}
                      disabled={!selectedProduct || availableStock <= 0}
                    />
                    {selectedProduct && availableStock > 0 && quantity > 0 && (
                      <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                        Stock: {formatStockKg(availableStock)} → <span className="font-bold">{formatStockKg(projectedStockKg)}</span> after sale
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-earth-700 mb-1.5">Price per kg (auto)</label>
                    <div className="input-field bg-earth-50 text-earth-800 font-semibold">
                      {unitPrice > 0 ? `${unitPrice.toFixed(2)} ETB` : '—'}
                    </div>
                  </div>
                </div>
                {isCreditSale && (
                  <div>
                    <label className="block text-sm font-bold text-earth-700 mb-1.5">Paid now (manual for credit)</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      max={saleTotal}
                      className="input-field"
                      {...register('amountPaid', { valueAsNumber: true })}
                    />
                    <p className="mt-1 text-xs text-earth-500">Enter 0 for full credit, or a partial amount paid today.</p>
                  </div>
                )}
                <div className="rounded-2xl border border-earth-100 bg-earth-50 p-4">
                  <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wide text-earth-500">Sale total</div>
                      <div className="text-xl font-black text-earth-950">{saleTotal.toFixed(2)} ETB</div>
                      <div className="text-xs text-earth-500">{quantity} × {unitPrice.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wide text-earth-500">Paid now</div>
                      <div className="text-xl font-black text-green-700">{effectiveAmountPaid.toFixed(2)} ETB</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wide text-earth-500">Balance / credit</div>
                      <div className={`text-xl font-black ${saleBalance === 0 ? 'text-green-700' : 'text-red-700'}`}>{saleBalance.toFixed(2)} ETB</div>
                      <div className={`text-xs font-bold ${saleBalance === 0 ? 'text-green-700' : 'text-amber-700'}`}>{saleStatus}</div>
                    </div>
                  </div>
                </div>
                <button className="btn-primary w-full" type="submit" disabled={!canSubmit}>
                  {isCreatingSale ? 'Posting sale...' : 'Post sale'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 card overflow-x-auto">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                  <h2 className="font-display text-xl font-black text-earth-950">Sales Register</h2>
                  <p className="text-sm text-earth-500">
                    {openCreditOnly
                      ? `Showing ${tableSales.length} open credit sale${tableSales.length === 1 ? '' : 's'} (${totalOutstanding.toFixed(2)} ETB owed).`
                      : `Showing ${tableSales.length} sale${tableSales.length === 1 ? '' : 's'} for ${salesPeriodLabels[salesPeriod].toLowerCase()}.`}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className={`rounded-full px-3 py-1 text-xs font-bold ${openCreditOnly ? 'bg-red-600 text-white' : 'bg-earth-100 text-earth-700'}`}
                    onClick={() => setOpenCreditOnly((value) => !value)}
                  >
                    {openCreditOnly ? 'Show period sales' : 'Open credit only'}
                  </button>
                  {!openCreditOnly && salesPeriod === 'today' && (
                    <input type="date" className="input-field sm:max-w-[180px]" value={filterDate} onChange={(event) => setFilterDate(event.target.value)} />
                  )}
                </div>
              </div>
              {sLoading ? (
                <div>Loading...</div>
              ) : tableSales.length === 0 ? (
                <div className="rounded-xl border border-dashed border-earth-200 p-6 text-sm text-earth-500">
                  {openCreditOnly ? 'No open credit sales right now.' : `No sales recorded on ${filterDate}.`}
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-earth-500">
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Sale Code</th>
                      <th className="pb-3">Customer</th>
                      <th className="pb-3">Product</th>
                      <th className="pb-3">Qty</th>
                      <th className="pb-3">Total</th>
                      <th className="pb-3">Paid</th>
                      <th className="pb-3">Balance</th>
                      <th className="pb-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableSales.map((sale) => (
                      <tr key={sale.id} className="border-t border-earth-100">
                        <td className="py-3">{toLocalDateKey(sale.sale_date)}</td>
                        <td className="py-3 font-medium text-earth-900">{sale.sale_code}</td>
                        <td className="py-3">{sale.customer_name || 'Walk-in'}</td>
                        <td className="py-3">{sale.product_name}</td>
                        <td className="py-3">{sale.quantity}</td>
                        <td className="py-3">{Number(sale.total_amount).toFixed(2)}</td>
                        <td className="py-3">{Number(sale.amount_paid).toFixed(2)}</td>
                        <td className="py-3">
                          <span className={Number(sale.balance) > 0 ? 'font-semibold text-red-700' : 'font-semibold text-green-700'}>
                            {Number(sale.balance).toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 whitespace-nowrap">
                          {Number(sale.balance) > 0 && (
                            <button
                              className="text-spice-700 font-bold mr-3"
                              onClick={() => {
                                setRepaySaleId(sale.id)
                                resetRepayment({ amount: Number(sale.balance), paymentDate: today })
                              }}
                            >
                              Record Payment
                            </button>
                          )}
                          <button
                            className="text-red-600 font-bold"
                            onClick={async () => {
                              if (!confirm('Delete this sale? Product stock will be restored.')) return
                              setMessage(null)
                              try {
                                await deleteSale(sale.id)
                                setMessage({ type: 'success', text: 'Sale deleted and stock restored.' })
                              } catch (err) {
                                setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Could not delete sale.' })
                              }
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-earth-200 bg-earth-50 font-bold text-earth-900">
                      <td className="py-3" colSpan={5}>
                        {openCreditOnly ? 'Open credit total' : `${filterDate} totals`}
                      </td>
                      <td className="py-3">{tableSales.reduce((sum, sale) => sum + Number(sale.total_amount), 0).toFixed(2)}</td>
                      <td className="py-3">{tableSales.reduce((sum, sale) => sum + Number(sale.amount_paid), 0).toFixed(2)}</td>
                      <td className="py-3">{tableSales.reduce((sum, sale) => sum + Number(sale.balance), 0).toFixed(2)}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>

          {repaySaleId && selectedRepaySale && (
            <div className="card max-w-xl">
              <h2 className="font-display text-xl font-black text-earth-950 mb-1">Record Customer Repayment</h2>
              <p className="mb-4 text-sm text-earth-500">
                {selectedRepaySale.sale_code} • {selectedRepaySale.customer_name || 'Customer'} • {selectedRepaySale.product_name} • remaining {Number(selectedRepaySale.balance).toFixed(2)} ETB
              </p>
              <form onSubmit={handleRepaymentSubmit(onRepaymentSubmit)} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3">
                <input type="number" step="0.01" className="input-field" {...registerRepayment('amount', { valueAsNumber: true })} placeholder="Amount" />
                <input type="date" className="input-field" {...registerRepayment('paymentDate')} />
                <button className="btn-primary" type="submit" disabled={isCreatingRepayment}>
                  {isCreatingRepayment ? 'Saving...' : 'Save'}
                </button>
              </form>
              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  className="text-sm font-bold text-spice-700"
                  onClick={() => resetRepayment({ amount: Number(selectedRepaySale.balance), paymentDate: today })}
                >
                  Pay full balance
                </button>
                <button className="text-sm text-earth-500 hover:text-earth-700" onClick={() => setRepaySaleId(null)}>Cancel payment</button>
              </div>
            </div>
          )}

          <div className="card overflow-x-auto">
            <h2 className="font-display text-xl font-black text-earth-950 mb-1">Repayment Trail</h2>
            <p className="mb-4 text-sm text-earth-500">Recent customer payments applied to credit sales.</p>
            {repaymentList.length === 0 ? (
              <div className="text-earth-500">No repayments recorded yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-earth-500">
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Sale</th>
                    <th className="pb-3">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {repaymentList.slice(0, 12).map((payment) => (
                    <tr key={payment.id} className="border-t border-earth-100">
                      <td className="py-3">{toLocalDateKey(payment.payment_date)}</td>
                      <td className="py-3">{payment.sale_code}</td>
                      <td className="py-3 font-semibold text-green-700">{Number(payment.amount).toFixed(2)} ETB</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
