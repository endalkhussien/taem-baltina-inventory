const fs = require('fs')
const path = require('path')

function parseEnvLine(line) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) return null

  const separatorIndex = trimmed.indexOf('=')
  if (separatorIndex === -1) return null

  const key = trimmed.slice(0, separatorIndex).trim()
  const value = trimmed
    .slice(separatorIndex + 1)
    .trim()
    .replace(/^['"]|['"]$/g, '')

  return key ? { key, value } : null
}

function loadEnvFile(filename) {
  const filePath = path.join(process.cwd(), filename)
  if (!fs.existsSync(filePath)) return false

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/)
  for (const line of lines) {
    const parsed = parseEnvLine(line)
    if (!parsed) continue
    if (process.env[parsed.key] === undefined) {
      process.env[parsed.key] = parsed.value
    }
  }

  return true
}

/** Load .env then .env.local (same as Next.js / drizzle.config). */
function loadProjectEnv() {
  loadEnvFile('.env')
  loadEnvFile('.env.local')
}

function requireDatabaseUrl() {
  loadProjectEnv()

  const cliUrl = process.argv.slice(2).find((arg) => /^postgres(ql)?:\/\//i.test(arg))
  if (cliUrl) return cliUrl

  const url = process.env.DATABASE_URL
  if (url) return url

  throw new Error(
    [
      'DATABASE_URL is not set.',
      '',
      'Command Prompt (same window — check with: echo %DATABASE_URL%):',
      '  set "DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require"',
      '  npm run migrate:decimal-sales',
      '',
      'Or pass the URL directly:',
      '  node scripts/migrate-decimal-sales.js "postgresql://USER:PASSWORD@HOST/DB?sslmode=require"',
      '',
      'Or create a .env file in the project folder:',
      '  DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require',
      '',
      'Use the same string as Vercel → Settings → Environment Variables.',
      'Easiest skip: run the SQL in Neon SQL Editor (see project README / PR #29).'
    ].join('\n')
  )
}

module.exports = { loadProjectEnv, requireDatabaseUrl }
