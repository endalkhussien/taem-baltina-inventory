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

  const cwd = process.cwd()
  const envPath = path.join(cwd, '.env')
  const envLocalPath = path.join(cwd, '.env.local')

  throw new Error(
    [
      'DATABASE_URL is not set.',
      '',
      `Folder: ${cwd}`,
      `.env file: ${fs.existsSync(envPath) ? 'found' : 'missing'}`,
      `.env.local file: ${fs.existsSync(envLocalPath) ? 'found' : 'missing'}`,
      '',
      'EASIEST (no URL in CMD) — Neon SQL Editor, run:',
      '  ALTER TABLE sales ALTER COLUMN quantity TYPE NUMERIC(14,3) USING quantity::numeric;',
      '  ALTER TABLE products ALTER COLUMN stock_quantity TYPE NUMERIC(14,3) USING stock_quantity::numeric;',
      '',
      'OR paste Vercel URL in one command (Command Prompt):',
      '  node scripts/migrate-decimal-sales.js "postgresql://USER:PASSWORD@HOST/DB?sslmode=require"',
      '',
      'OR create .env in the project folder (same folder as package.json):',
      '  DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require',
      '  then: npm run migrate:decimal-sales',
      '',
      'Copy DATABASE_URL from Vercel → Project → Settings → Environment Variables.'
    ].join('\n')
  )
}

module.exports = { loadProjectEnv, requireDatabaseUrl }
