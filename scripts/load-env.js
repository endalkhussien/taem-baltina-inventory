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

  const url = process.env.DATABASE_URL
  if (url) return url

  throw new Error(
    [
      'DATABASE_URL is not set.',
      '',
      'PowerShell (run in the same window, then migrate):',
      '  $env:DATABASE_URL = "postgresql://USER:PASSWORD@HOST/DB?sslmode=require"',
      '  npm run migrate:decimal-sales',
      '',
      'Or create a .env file in the project folder with:',
      '  DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?sslmode=require',
      '',
      'Use the same connection string as Vercel → Settings → Environment Variables.'
    ].join('\n')
  )
}

module.exports = { loadProjectEnv, requireDatabaseUrl }
