/** Display helpers for public marketplace (images/copy are curated, stock/price are live). */

const PRODUCT_IMAGES: { match: RegExp; image: string; blurb: string; tags: string[] }[] = [
  {
    match: /berbere/i,
    image:
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1200&q=80',
    blurb: 'The complex, fiery heart of Ethiopian cooking — chili, fenugreek, and sacred herbs in balance.',
    tags: ['Signature', 'Spicy']
  },
  {
    match: /shiro/i,
    image:
      'https://images.unsplash.com/photo-1599909533730-f9dabc9f2664?auto=format&fit=crop&w=1200&q=80',
    blurb: 'Roasted chickpea warmth for weeknight stews and long-simmered classics.',
    tags: ['Essential', 'Comfort']
  },
  {
    match: /mitmita/i,
    image:
      'https://images.unsplash.com/photo-1506368249639-73a05d6f6488?auto=format&fit=crop&w=1200&q=80',
    blurb: 'Bright heat and cardamom lift — the finish for raw meats, kitfo, and bold marinades.',
    tags: ['Extra Hot', 'Finishing']
  },
  {
    match: /teff|injera|flour/i,
    image:
      'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80',
    blurb: 'Highland grain foundations for fermented breads and daily tables.',
    tags: ['Grain', 'Heritage']
  }
]

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=1200&q=80'

export function productPresentation(name: string) {
  const hit = PRODUCT_IMAGES.find((entry) => entry.match.test(name))
  return {
    image: hit?.image ?? FALLBACK_IMAGE,
    blurb: hit?.blurb ?? 'Small-batch Ethiopian pantry spice, milled and blended for everyday cooking.',
    tags: hit?.tags ?? ['Artisan', 'Pantry']
  }
}

export function marketplaceProductPayload(product: {
  id: number
  name: string
  selling_price: number
  stock_quantity: number
  alert_threshold?: number
}) {
  const presentation = productPresentation(product.name)
  const stock = Number(product.stock_quantity)
  const inStock = stock > 0
  const lowStock =
    inStock &&
    product.alert_threshold != null &&
    stock <= Number(product.alert_threshold)

  return {
    id: product.id,
    name: product.name,
    selling_price: Number(product.selling_price),
    stock_quantity: stock,
    in_stock: inStock,
    low_stock: Boolean(lowStock),
    image: presentation.image,
    blurb: presentation.blurb,
    tags: presentation.tags
  }
}
