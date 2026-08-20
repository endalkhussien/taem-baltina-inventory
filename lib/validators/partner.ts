import { z } from 'zod'

export const partnerRegisterSchema = z.object({
  shop_name: z.string().trim().min(2).max(255),
  owner_name: z.string().trim().min(2).max(255),
  phone: z.string().trim().min(8).max(50),
  password: z.string().min(6).max(200),
  city: z.string().trim().min(2).max(120).default('Addis Ababa'),
  address: z.string().trim().max(2000).optional().nullable()
})

export const partnerLoginSchema = z.object({
  phone: z.string().trim().min(1),
  password: z.string().min(1)
})

export const partnerBuySchema = z.object({
  notes: z.string().trim().max(2000).optional().nullable(),
  items: z
    .array(
      z.object({
        product_id: z.number().int().positive(),
        quantity_kg: z.number().positive()
      })
    )
    .min(1)
})

export const partnerStockRegisterSchema = z.object({
  product_id: z.number().int().positive(),
  quantity_kg: z.number().positive(),
  unit_cost: z.number().min(0)
})

export const partnerSaleSchema = z.object({
  product_id: z.number().int().positive(),
  quantity_kg: z.number().positive(),
  unit_price: z.number().positive(),
  amount_paid: z.number().min(0),
  customer_name: z.string().trim().max(255).optional().nullable()
})

export const partnerExpenseSchema = z.object({
  title: z.string().trim().min(1).max(255),
  category: z.string().trim().min(1).max(100).default('other'),
  amount: z.number().positive(),
  notes: z.string().trim().max(2000).optional().nullable()
})

export const partnerShopStatusSchema = z.object({
  status: z.enum(['active', 'suspended'])
})

export const partnerBuyStatusSchema = z.object({
  status: z.enum(['pending', 'fulfilled', 'cancelled'])
})
