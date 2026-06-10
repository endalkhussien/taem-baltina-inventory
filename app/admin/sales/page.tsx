"use client"
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useProducts } from '../../../hooks/useProducts'
import { useSales } from '../../../hooks/useModules'
import AdminNav from '../../../components/AdminNav'

export default function SalesPage() {
  const { data: products, isLoading: pLoading } = useProducts()
  const { data: sales, isLoading: sLoading, createSale, deleteSale } = useSales()
  const { register, handleSubmit, reset } = useForm({ defaultValues: { productId: 0, quantity: 0, unitPrice: 0, amountPaid: 0 } })

  const onSubmit = async (vals: any) => {
    await createSale(vals)
    reset()
  }

  const productList = Array.isArray(products) ? products : []
  const salesList = Array.isArray(sales) ? sales : []

  return (
    <>
      <AdminNav />
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-6">Sales</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white shadow rounded p-4">
            <h2 className="text-lg font-medium mb-3">New Sale</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div><label className="block text-sm text-gray-700">Product</label><select className="w-full border rounded px-2 py-1" {...register('productId')}><option value="">Select</option>{productList.map((p: any) => (<option key={p.id} value={p.id}>{p.name}</option>))}</select></div>
              <div><label className="block text-sm text-gray-700">Qty</label><input type="number" className="w-full border rounded px-2 py-1" {...register('quantity')} /></div>
              <div><label className="block text-sm text-gray-700">Unit Price (ETB)</label><input type="number" step="0.01" className="w-full border rounded px-2 py-1" {...register('unitPrice')} /></div>
              <div><label className="block text-sm text-gray-700">Amount Paid (ETB)</label><input type="number" step="0.01" className="w-full border rounded px-2 py-1" {...register('amountPaid')} /></div>
              <button className="w-full bg-green-600 text-white py-2 rounded">Create Sale</button>
            </form>
          </div>
          <div className="lg:col-span-2 bg-white shadow rounded p-4">
            <h2 className="text-lg font-medium mb-3">Sales List</h2>
            {sLoading ? <div>Loading...</div> : <table className="w-full text-sm"><thead><tr className="text-left text-xs text-gray-500"><th className="pb-2">Code</th><th className="pb-2">Total</th><th className="pb-2">Paid</th><th className="pb-2">Balance</th><th className="pb-2">Status</th><th className="pb-2">Action</th></tr></thead><tbody>{salesList.map((s: any) => (<tr key={s.id} className="border-t"><td className="py-2">{s.sale_code}</td><td className="py-2">{Number(s.total_amount).toFixed(2)}</td><td className="py-2">{Number(s.amount_paid).toFixed(2)}</td><td className="py-2">{Number(s.balance).toFixed(2)}</td><td className="py-2"><span className={`px-2 py-1 rounded text-xs ${s.payment_status === 'Paid' ? 'bg-green-100 text-green-700' : s.payment_status === 'Partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{s.payment_status}</span></td><td className="py-2"><button className="text-red-600 text-sm" onClick={() => deleteSale(s.id)}>Delete</button></td></tr>))}</tbody></table>}
          </div>
        </div>
      </div>
    </>
  )
}


