import { NextResponse } from 'next/server'
import { resetAdminPassword } from '../../../../lib/adminUsers'
import { databaseErrorResponse, parseJsonBody } from '../../../../lib/apiErrors'
import { resetPasswordSchema } from '../../../../lib/validators/auth'

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody(request)
    if (!body.ok) return body.response

    const parsed = resetPasswordSchema.safeParse(body.data)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message || 'Invalid password reset request.'
      return NextResponse.json({ error: message }, { status: 422 })
    }

    const { username, recoverySecret, newPassword } = parsed.data
    const result = await resetAdminPassword(username, recoverySecret, newPassword)

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json({
      ok: true,
      message: result.created
        ? 'Admin account created. You can now sign in with your new password.'
        : 'Password reset successfully. You can now sign in with your new password.'
    })
  } catch (err) {
    return databaseErrorResponse(err, 'Could not reset password')
  }
}
