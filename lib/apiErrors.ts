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

export async function parseJsonBody(request: Request) {
  try {
    return { ok: true as const, data: await request.json() }
  } catch {
    return {
      ok: false as const,
      response: NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
    }
  }
}

export function databaseErrorResponse(error: unknown, action: string) {
  console.error(action, error)

  const message = getNestedMessage(error) ?? 'Unknown database error.'
  const missingColumn = /column "([^"]+)" of relation "([^"]+)" does not exist/.exec(message)
  const hint = missingColumn
    ? `Database is missing column ${missingColumn[1]} on table ${missingColumn[2]}. Run: npm run drizzle:push (with DATABASE_URL set to your Neon connection string).`
    : 'Check that DATABASE_URL points to the correct database and run npm run drizzle:push to create or update tables.'

  return NextResponse.json(
    {
      error: `${action}: ${message}`,
      hint
    },
    { status: 500 }
  )
}
