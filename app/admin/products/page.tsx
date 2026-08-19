"use client"

import React, { Suspense, useEffect, useMemo, useState } from 'react'
import ProductList from '../../../components/ProductList'
import ProductForm from '../../../components/ProductForm'
import ProductRecipeEditor from '../../../components/ProductRecipeEditor'
import AdminNav from '../../../components/AdminNav'
import { useProducts } from '../../../hooks/useProducts'

function ProductsContent() {
  const [editing, setEditing] = useState<number | null>(null)
  const [recipeProductId, setRecipeProductId] = useState<number | null>(null)
  const { data: products } = useProducts()
  const productList = useMemo(() => (Array.isArray(products) ? products : []), [products])
  const recipeProduct = productList.find((product) => product.id === recipeProductId) ?? null

  useEffect(() => {
    if (recipeProductId !== null) return
    if (productList.length > 0) setRecipeProductId(productList[0].id)
  }, [productList, recipeProductId])

  return (
    <div className="app-page">
      <div className="app-container">
        <div className="page-hero-subtle">
          <div className="eyebrow">Inventory</div>
          <h1 className="mt-2 font-display text-4xl font-bold text-earth-950">Finished products</h1>
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
          <ProductRecipeEditor
            productId={recipeProductId}
            productName={recipeProduct?.name}
            onProductSelect={setRecipeProductId}
          />
        </div>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <>
      <AdminNav />
      <Suspense fallback={<div className="app-page"><div className="app-container card">Loading stock workspace...</div></div>}>
        <ProductsContent />
      </Suspense>
    </>
  )
}
