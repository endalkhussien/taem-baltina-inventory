'use client'

import { useEffect, useState } from 'react'
import { ProductCard, type ShopProduct } from './ProductCard'
import { useCart } from './CartProvider'
import { useToast } from '../ToastProvider'

export default function ShopCatalogClient() {
  const [products, setProducts] = useState<ShopProduct[]>([])
  const [loading, setLoading] = useState(true)
  const { addItem } = useCart()
  const toast = useToast()

  useEffect(() => {
    fetch('/api/public/products')
      .then((r) => r.json())
      .then((data: ShopProduct[]) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => toast.error('Could not load products.'))
      .finally(() => setLoading(false))
  }, [toast])

  return (
    <div className="mx-auto max-w-[1280px] px-5 py-12 md:px-16">
      <div className="mb-10 max-w-2xl">
        <span className="text-xs font-bold uppercase tracking-widest text-[#9e3d00]">Collection</span>
        <h1 className="mt-2 font-display text-4xl font-bold text-[#2c1600]">Spice Collection</h1>
        <p className="mt-3 text-lg text-[#594238]">
          Dynamic catalog from kitchen stock. Add kilograms to your bag and checkout when ready.
        </p>
      </div>

      {loading ? (
        <p className="text-[#594238]">Loading…</p>
      ) : products.length === 0 ? (
        <div className="rounded-lg bg-[#fff1e7] p-10 text-[#594238]">No products in the catalog yet.</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAdd={
                product.in_stock
                  ? () => {
                      addItem({
                        productId: product.id,
                        name: product.name,
                        unitPrice: product.selling_price,
                        image: product.image,
                        stock: product.stock_quantity,
                        quantityKg: 1
                      })
                      toast.success(`${product.name} added.`)
                    }
                  : undefined
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
