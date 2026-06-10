"use client"

import React, { useState } from 'react'
import ProductList from '../../../components/ProductList'
import ProductForm from '../../../components/ProductForm'
import ProductRecipeEditor from '../../../components/ProductRecipeEditor'
import AdminNav from '../../../components/AdminNav'
import { useProducts } from '../../../hooks/useProducts'

export default function ProductsPage() {
  const [editing, setEditing] = useState<number | null>(null)
  const [recipeProductId, setRecipeProductId] = useState<number | null>(null)
  const { data: products } = useProducts()
  const recipeProduct = Array.isArray(products) ? products.find((product) => product.id === recipeProductId) : null

  return (
    <>
      <AdminNav />
      <div className="min-h-screen bg-spice-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-earth-900">Products</h1>
          <p className="text-earth-500 text-sm mt-1">Manage finished goods, selling prices, recipes, and product stock.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <ProductForm editingId={editing} onDone={() => setEditing(null)} />
          </div>
          <div className="lg:col-span-2">
            <ProductList onEdit={(id) => setEditing(id)} onRecipe={(id) => setRecipeProductId(id)} />
          </div>
        </div>
        <div className="mt-6">
          <ProductRecipeEditor productId={recipeProductId} productName={recipeProduct?.name} />
        </div>
      </div>
    </div>
    </>
  )
}
