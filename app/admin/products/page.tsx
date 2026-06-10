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
      <div className="app-page">
      <div className="app-container">
        <div className="page-hero-subtle">
          <div className="eyebrow">Finished goods catalog</div>
          <h1 className="mt-2 font-display text-4xl font-black text-earth-950">Finished Goods Ready to Sell</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-earth-500">
            Maintain selling prices, available stock, reorder alerts, and the recipes that connect each product to raw materials.
          </p>
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
