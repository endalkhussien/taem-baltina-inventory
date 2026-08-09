import { NextResponse } from 'next/server'
import { authenticateAdmin, updateAdminPassword } from '../../../../lib/adminUsers'
import { databaseErrorResponse, parseJsonBody } from '../../../../lib/apiErrors'
import { getSessionFromRequest } from '../../../../lib/auth'
import { changePasswordSchema } from '../../../../lib/validators/auth'

export async function POST(request: Request) {
  try {
    const session = await getSessionFromRequest(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await parseJsonBody(request)
    if (!body.ok) return body.response

    const parsed = changePasswordSchema.safeParse(body.data)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || 'Invalid password change request.'
      return NextResponse.json({ error: message }, { status: 422 })
    }

    const { currentPassword, newPassword } = parsed.data
    const user = await authenticateAdmin(session.username, currentPassword)
    if (!user) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 })
    }

    await updateAdminPassword(session.userId, newPassword)

    return NextResponse.json({ ok: true, message: 'Password updated successfully.' })
  } catch (err) {
    return databaseErrorResponse(err, 'Could not change password')
  }
}
