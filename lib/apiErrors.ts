import { NextResponse } from 'next/server'

type ErrorLike = {
  message?: string
  detail?: string
  code?: string
  cause?: unknown
}

function isErrorLike(error: unknown): error is ErrorLike {
  return typeof error === 'object' && error !== null
}

function getNestedMessage(error: unknown): string | null {
  if (!isErrorLike(error)) return null

  if (error.cause) {
    const causeMessage = getNestedMessage(error.cause)
    if (causeMessage) return causeMessage
  }

  const message = error.detail || error.message
  if (!message) return null

  const code = error.code ? ` (code ${error.code})` : ''
  return `${message}${code}`
}

export function databaseErrorResponse(error: unknown, action: string) {
  console.error(action, error)

  const message = getNestedMessage(error) ?? 'Unknown database error.'

  return NextResponse.json(
    {
      error: `${action}: ${message}`,
      hint: 'Check that DATABASE_URL points to the correct database and run npm run drizzle:push to create or update tables.'
    },
    { status: 500 }
  )
}
