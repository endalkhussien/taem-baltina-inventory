import { NextResponse } from 'next/server'
import { PARTNER_COOKIE, partnerCookieOptions, signPartnerToken } from '../../../../../lib/partnerAuth'
import { createPartnerShop } from '../../../../../lib/partnerUsers'
import { partnerRegisterSchema } from '../../../../../lib/validators/partner'
import { databaseErrorResponse, parseJsonBody } from '../../../../../lib/apiErrors'

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request)
    if (!body.ok) return body.response

    const parsed = partnerRegisterSchema.safeParse(body.data)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Please fill shop name, owner, phone, and a password of at least 6 characters.' }, { status: 422 })
    }

    const result = await createPartnerShop(parsed.data)
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 409 })
    }

    const token = await signPartnerToken({
      shopId: result.shop.id,
      phone: result.shop.phone,
      shopName: result.shop.shop_name
    })

    const res = NextResponse.json({ ok: true, shop: result.shop })
    res.cookies.set(PARTNER_COOKIE, token, partnerCookieOptions())
    return res
  } catch (err) {
    return databaseErrorResponse(err, 'Could not register shop')
  }
}
