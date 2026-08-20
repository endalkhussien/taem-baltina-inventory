import { eq } from 'drizzle-orm'
import { db, schema } from './db'
import { hashPassword, verifyPassword } from './password'

export function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, '').trim()
}

export async function findPartnerByPhone(phone: string) {
  const [shop] = await db
    .select()
    .from(schema.partner_shops)
    .where(eq(schema.partner_shops.phone, normalizePhone(phone)))
    .limit(1)

  return shop ?? null
}

export async function createPartnerShop(input: {
  shop_name: string
  owner_name: string
  phone: string
  password: string
  city: string
  address?: string | null
}) {
  const phone = normalizePhone(input.phone)
  const existing = await findPartnerByPhone(phone)
  if (existing) return { error: 'This phone is already registered.' as const }

  const password_hash = await hashPassword(input.password)
  const [created] = await db
    .insert(schema.partner_shops)
    .values({
      shop_name: input.shop_name.trim(),
      owner_name: input.owner_name.trim(),
      phone,
      password_hash,
      city: input.city.trim() || 'Addis Ababa',
      address: input.address?.trim() || null,
      status: 'active'
    })
    .returning({
      id: schema.partner_shops.id,
      shop_name: schema.partner_shops.shop_name,
      phone: schema.partner_shops.phone,
      status: schema.partner_shops.status
    })

  return { shop: created }
}

export async function authenticatePartner(phone: string, password: string) {
  const shop = await findPartnerByPhone(phone)
  if (!shop) return { error: 'Invalid phone or password.' as const }

  const valid = await verifyPassword(password, shop.password_hash)
  if (!valid) return { error: 'Invalid phone or password.' as const }

  if (shop.status !== 'active') {
    return { error: 'This shop is not active. Contact Taem Baltina.' as const }
  }

  return {
    shop: {
      id: shop.id,
      shop_name: shop.shop_name,
      phone: shop.phone,
      owner_name: shop.owner_name,
      city: shop.city,
      status: shop.status
    }
  }
}
