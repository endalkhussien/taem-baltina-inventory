"use client"
import React, { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useProducts } from '../../../hooks/useProducts'
import { useCustomers, useRepayments, useSales } from '../../../hooks/useModules'
import AdminNav from '../../../components/AdminNav'

const today = new Date().toISOString().slice(0, 10)

export default function SalesPage() {
  const { data: products } = useProducts()
  const { data: customers } = useCustomers()
  const { data: sales, isLoading: sLoading, createSale, isCreatingSale, deleteSale } = useSales()
  const { data: repayments, createRepayment, isCreatingRepayment } = useRepayments()
  const [filterDate, setFilterDate] = useState(today)
  const [openCreditOnly, setOpenCreditOnly] = useState(false)
  const [repaySaleId, setRepaySaleId] = useState<number | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const { register, handleSubmit, reset, watch, setValue } = useForm({ defaultValues: { productId: 0, customerId: 0, quantity: 1, unitPrice: 0, amountPaid: 0, saleDate: today } })
  const { register: registerRepayment, handleSubmit: handleRepaymentSubmit, reset: resetRepayment } = useForm({ defaultValues: { amount: 0, paymentDate: today } })
  const selectedProductId = Number(watch('productId') || 0)
  const quantity = Number(watch('quantity') || 0)
  const unitPrice = Number(watch('unitPrice') || 0)
  const amountPaid = Number(watch('amountPaid') || 0)
  const saleTotal = quantity * unitPrice
  const saleBalance = Math.max(0, saleTotal - amountPaid)
  const saleStatus = saleBalance === 0 ? 'Paid' : amountPaid > 0 ? 'Partial credit' : 'Credit'

  const onSubmit = async (vals: any) => {
    setMessage(null)
    try {
      await createSale(vals)
      reset({ productId: 0, customerId: 0, quantity: 1, unitPrice: 0, amountPaid: 0, saleDate: today })
      setMessage({ type: 'success', text: 'Sale recorded and stock updated.' })
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Could not record sale.' })
    }
  }

  const productList = useMemo(() => Array.isArray(products) ? products : [], [products])
  const customerList = useMemo(() => Array.isArray(customers) ? customers : [], [customers])
  const salesList = useMemo(() => Array.isArray(sales) ? sales : [], [sales])
  const repaymentList = Array.isArray(repayments) ? repayments : []
  const filteredSales = useMemo(
    () => salesList.filter((sale) => {
      const matchesDate = openCreditOnly ? true : new Date(sale.sale_date).toISOString().slice(0, 10) === filterDate
      const matchesCredit = openCreditOnly ? Number(sale.balance) > 0 : true
      return matchesDate && matchesCredit
    }),
    [filterDate, openCreditOnly, salesList]
  )
  const selectedRepaySale = salesList.find((sale) => sale.id === repaySaleId) ?? null
  const totalDailySales = filteredSales.reduce((sum, sale) => sum + Number(sale.total_amount), 0)
  const totalDailyCash = filteredSales.reduce((sum, sale) => sum + Number(sale.amount_paid), 0)
  const totalOutstanding = salesList.reduce((sum, sale) => sum + Number(sale.balance), 0)

  useEffect(() => {
    const product = productList.find((item) => item.id === selectedProductId)
    if (product) setValue('unitPrice', Number(product.selling_price))
  }, [productList, selectedProductId, setValue])

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
                Record sold products, connect unpaid balances to customers, and trace every partial repayment until the sale is fully paid.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
                <div className="text-xs uppercase tracking-[0.16em] text-spice-100">Selected day sales</div>
                <div className="text-xl font-black text-white">{totalDailySales.toFixed(2)}</div>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
                <div className="text-xs uppercase tracking-[0.16em] text-spice-100">Cash received</div>
                <div className="text-xl font-black text-white">{totalDailyCash.toFixed(2)}</div>
              </div>
              <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
                <div className="text-xs uppercase tracking-[0.16em] text-spice-100">Open credit</div>
                <div className="text-xl font-black text-white">{totalOutstanding.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {message && <div className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${message.type === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{message.text}</div>}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card">
              <h2 className="font-display text-xl font-black text-earth-950 mb-1">Record Product Sale</h2>
              <p className="mb-5 text-sm text-earth-500">Paid sales can be walk-in; partial or credit sales must use a customer account.</p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-earth-700 mb-1.5">Sale Date</label>
                  <input type="date" className="input-field" {...register('saleDate')} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-earth-700 mb-1.5">Finished Good Sold</label>
                  <select className="input-field" {...register('productId', { valueAsNumber: true })}>
                    <option value={0}>Select product</option>
                    {productList.map((product) => (
                      <option key={product.id} value={product.id}>{product.name} ({product.stock_quantity} in stock)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-earth-700 mb-1.5">Customer Account</label>
                  <select className="input-field" {...register('customerId', { valueAsNumber: true })}>
                    <option value={0}>Walk-in / paid customer</option>
                    {customerList.map((customer) => (
                      <option key={customer.id} value={customer.id}>{customer.name}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-earth-500">Choose a customer for partial or credit sales.</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-earth-700 mb-1.5">Qty</label>
                    <input type="number" className="input-field" {...register('quantity', { valueAsNumber: true })} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-earth-700 mb-1.5">Unit Price</label>
                    <input type="number" step="0.01" className="input-field" {...register('unitPrice', { valueAsNumber: true })} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-earth-700 mb-1.5">Paid Now</label>
                    <input type="number" step="0.01" className="input-field" {...register('amountPaid', { valueAsNumber: true })} />
                  </div>
                </div>
                <div className="rounded-2xl border border-earth-100 bg-earth-50 p-4">
                  <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wide text-earth-500">Sale total</div>
                      <div className="text-xl font-black text-earth-950">{saleTotal.toFixed(2)} ETB</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wide text-earth-500">Balance / credit</div>
                      <div className="text-xl font-black text-red-700">{saleBalance.toFixed(2)} ETB</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wide text-earth-500">Status</div>
                      <div className={`text-xl font-black ${saleBalance === 0 ? 'text-green-700' : 'text-amber-700'}`}>{saleStatus}</div>
                    </div>
                  </div>
                </div>
                <button className="btn-primary w-full" type="submit" disabled={isCreatingSale}>
                  {isCreatingSale ? 'Posting sale...' : 'Post sale'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 card overflow-x-auto">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                  <h2 className="font-display text-xl font-black text-earth-950">Daily Sales Register</h2>
                  <p className="text-sm text-earth-500">{openCreditOnly ? 'Showing all open credit sales.' : 'Filter by date to review sold quantity, cash collected, and credit created.'}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className={`rounded-full px-3 py-1 text-xs font-bold ${openCreditOnly ? 'bg-red-600 text-white' : 'bg-earth-100 text-earth-700'}`}
                    onClick={() => setOpenCreditOnly((value) => !value)}
                  >
                    {openCreditOnly ? 'Show all sales' : 'Open credit only'}
                  </button>
                  {!openCreditOnly && (
                    <input type="date" className="input-field sm:max-w-[180px]" value={filterDate} onChange={(event) => setFilterDate(event.target.value)} />
                  )}
                </div>
              </div>
              {sLoading ? <div>Loading...</div> : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-earth-500">
                      <th className="pb-3">Sale Code</th>
                      <th className="pb-3">Customer Account</th>
                      <th className="pb-3">Finished Good</th>
                      <th className="pb-3">Qty</th>
                      <th className="pb-3">Total</th>
                      <th className="pb-3">Paid</th>
                      <th className="pb-3">Balance</th>
                      <th className="pb-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.map((sale) => (
                      <tr key={sale.id} className="border-t border-earth-100">
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
            {repaymentList.length === 0 ? <div className="text-earth-500">No repayments recorded yet.</div> : (
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
                      <td className="py-3">{new Date(payment.payment_date).toLocaleDateString()}</td>
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


