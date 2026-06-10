"use client"
import React, { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useProducts } from '../../../hooks/useProducts'
import { useCustomers, useRepayments, useSales } from '../../../hooks/useModules'
import AdminNav from '../../../components/AdminNav'

const today = new Date().toISOString().slice(0, 10)

export default function SalesPage() {
  const { data: products } = useProducts()
  const { data: customers } = useCustomers()
  const { data: sales, isLoading: sLoading, createSale, deleteSale } = useSales()
  const { data: repayments, createRepayment } = useRepayments()
  const [filterDate, setFilterDate] = useState(today)
  const [repaySaleId, setRepaySaleId] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const { register, handleSubmit, reset } = useForm({ defaultValues: { productId: 0, customerId: 0, quantity: 1, unitPrice: 0, amountPaid: 0, saleDate: today } })
  const { register: registerRepayment, handleSubmit: handleRepaymentSubmit, reset: resetRepayment } = useForm({ defaultValues: { amount: 0, paymentDate: today } })

  const onSubmit = async (vals: any) => {
    setMessage('')
    try {
      await createSale(vals)
      reset({ productId: 0, customerId: 0, quantity: 1, unitPrice: 0, amountPaid: 0, saleDate: today })
      setMessage('Sale recorded and stock updated.')
    } catch {
      setMessage('Could not record sale. Check stock, customer, and payment details.')
    }
  }

  const productList = Array.isArray(products) ? products : []
  const customerList = Array.isArray(customers) ? customers : []
  const salesList = Array.isArray(sales) ? sales : []
  const repaymentList = Array.isArray(repayments) ? repayments : []
  const filteredSales = useMemo(
    () => salesList.filter((sale) => new Date(sale.sale_date).toISOString().slice(0, 10) === filterDate),
    [filterDate, salesList]
  )
  const totalDailySales = filteredSales.reduce((sum, sale) => sum + Number(sale.total_amount), 0)
  const totalDailyCash = filteredSales.reduce((sum, sale) => sum + Number(sale.amount_paid), 0)
  const totalOutstanding = salesList.reduce((sum, sale) => sum + Number(sale.balance), 0)

  const onRepaymentSubmit = async (vals: any) => {
    if (!repaySaleId) return
    setMessage('')
    try {
      await createRepayment({ saleId: repaySaleId, ...vals })
      setRepaySaleId(null)
      resetRepayment({ amount: 0, paymentDate: today })
      setMessage('Payment recorded and customer balance updated.')
    } catch {
      setMessage('Could not record payment. Make sure the payment does not exceed the balance.')
    }
  }

  return (
    <>
      <AdminNav />
      <div className="min-h-screen bg-spice-50">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-display text-3xl font-bold text-earth-900">Sales & Credit</h1>
              <p className="text-earth-500 text-sm mt-1">Record daily product sales, link credit customers, and trace partial repayments.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="card !p-4">
                <div className="text-xs uppercase text-earth-500">Daily sales</div>
                <div className="text-xl font-bold text-spice-700">{totalDailySales.toFixed(2)}</div>
              </div>
              <div className="card !p-4">
                <div className="text-xs uppercase text-earth-500">Daily cash</div>
                <div className="text-xl font-bold text-green-700">{totalDailyCash.toFixed(2)}</div>
              </div>
              <div className="card !p-4">
                <div className="text-xs uppercase text-earth-500">Open credit</div>
                <div className="text-xl font-bold text-red-700">{totalOutstanding.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {message && <div className="rounded-xl bg-earth-50 border border-earth-100 px-4 py-3 text-sm text-earth-700">{message}</div>}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card">
              <h2 className="font-display text-lg font-semibold text-earth-900 mb-4">New Sale</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1.5">Sale Date</label>
                  <input type="date" className="input-field" {...register('saleDate')} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1.5">Product</label>
                  <select className="input-field" {...register('productId', { valueAsNumber: true })}>
                    <option value={0}>Select product</option>
                    {productList.map((product) => (
                      <option key={product.id} value={product.id}>{product.name} ({product.stock_quantity} in stock)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-earth-700 mb-1.5">Customer</label>
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
                    <label className="block text-sm font-medium text-earth-700 mb-1.5">Qty</label>
                    <input type="number" className="input-field" {...register('quantity', { valueAsNumber: true })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-earth-700 mb-1.5">Unit Price</label>
                    <input type="number" step="0.01" className="input-field" {...register('unitPrice', { valueAsNumber: true })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-earth-700 mb-1.5">Paid</label>
                    <input type="number" step="0.01" className="input-field" {...register('amountPaid', { valueAsNumber: true })} />
                  </div>
                </div>
                <button className="btn-primary w-full" type="submit">Record sale</button>
              </form>
            </div>

            <div className="lg:col-span-2 card overflow-x-auto">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                  <h2 className="font-display text-lg font-semibold text-earth-900">Daily Sales</h2>
                  <p className="text-sm text-earth-500">Filter by date to review daily sold quantity and credit.</p>
                </div>
                <input type="date" className="input-field sm:max-w-[180px]" value={filterDate} onChange={(event) => setFilterDate(event.target.value)} />
              </div>
              {sLoading ? <div>Loading...</div> : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-earth-500">
                      <th className="pb-3">Code</th>
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
                            <button className="text-spice-700 font-medium mr-3" onClick={() => setRepaySaleId(sale.id)}>Payment</button>
                          )}
                          <button className="text-red-600 font-medium" onClick={() => deleteSale(sale.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {repaySaleId && (
            <div className="card max-w-xl">
              <h2 className="font-display text-lg font-semibold text-earth-900 mb-4">Record Partial Payment</h2>
              <form onSubmit={handleRepaymentSubmit(onRepaymentSubmit)} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3">
                <input type="number" step="0.01" className="input-field" {...registerRepayment('amount', { valueAsNumber: true })} placeholder="Amount" />
                <input type="date" className="input-field" {...registerRepayment('paymentDate')} />
                <button className="btn-primary" type="submit">Save</button>
              </form>
              <button className="mt-3 text-sm text-earth-500 hover:text-earth-700" onClick={() => setRepaySaleId(null)}>Cancel payment</button>
            </div>
          )}

          <div className="card overflow-x-auto">
            <h2 className="font-display text-lg font-semibold text-earth-900 mb-4">Recent Repayments</h2>
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


