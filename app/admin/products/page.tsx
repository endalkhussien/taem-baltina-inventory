"use client"

import React, { useState } from 'react'
import ProductList from '../../../components/ProductList'
import ProductForm from '../../../components/ProductForm'
import AdminNav from '../../../components/AdminNav'

export default function ProductsPage() {
  const [editing, setEditing] = useState<number | null>(null)

  return (
    <>
      <AdminNav />
      <div className="min-h-screen bg-spice-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-earth-900">Products</h1>
          <p className="text-earth-500 text-sm mt-1">Manage finished goods inventory and pricing.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <ProductForm editingId={editing} onDone={() => setEditing(null)} />
          </div>
          <div className="lg:col-span-2">
            <ProductList onEdit={(id) => setEditing(id)} />
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
