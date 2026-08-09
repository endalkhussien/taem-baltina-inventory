const fs = require('fs')
const path = require('path')

const PROJECT_ROOT = path.join(__dirname, '..')
const ENV_FILES = ['.env', '.env.local', '.env.development', '.env.development.local']

function readTextFile(filePath) {
  const buffer = fs.readFileSync(filePath)

  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return buffer.toString('utf16le')
  }

  let text = buffer.toString('utf8')
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1)
  }

  return text
}

function parseEnvLine(line) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) return null

  const withoutExport = trimmed.startsWith('export ') ? trimmed.slice(7).trim() : trimmed
  const separatorIndex = withoutExport.indexOf('=')
  if (separatorIndex === -1) return null

  const key = withoutExport.slice(0, separatorIndex).trim()
  let value = withoutExport.slice(separatorIndex + 1).trim()

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1)
  }

  value = value.replace(/\r$/, '')

  return key ? { key, value } : null
}

function loadEnvFile(filename, root) {
  const filePath = path.join(root, filename)
  if (!fs.existsSync(filePath)) return { loaded: false, path: filePath, keys: [] }

  const lines = readTextFile(filePath).split(/\r?\n/)
  const keys = []

  for (const line of lines) {
    const parsed = parseEnvLine(line)
    if (!parsed) continue
    keys.push(parsed.key)
    if (process.env[parsed.key] === undefined) {
      process.env[parsed.key] = parsed.value
    }
  }

  return { loaded: true, path: filePath, keys }
}

function projectRoots() {
  const roots = [process.cwd(), PROJECT_ROOT]
  return [...new Set(roots.map((root) => path.resolve(root)))]
}

/** Load env files from project root and current working directory. */
function loadProjectEnv() {
  const loadedFiles = []

  for (const root of projectRoots()) {
    for (const filename of ENV_FILES) {
      const result = loadEnvFile(filename, root)
      if (result.loaded) loadedFiles.push(result)
    }
  }

  return loadedFiles
}

function requireDatabaseUrl() {
  const loadedFiles = loadProjectEnv()

  const cliUrl = process.argv.slice(2).find((arg) => /^postgres(ql)?:\/\//i.test(arg))
  if (cliUrl) return cliUrl

  const url = process.env.DATABASE_URL?.trim()
  if (url) return url

  const roots = projectRoots()
  const envChecks = ENV_FILES.map((name) => {
    const paths = roots.map((root) => path.join(root, name))
    const existing = paths.filter((filePath) => fs.existsSync(filePath))
    return { name, existing }
  })

  const foundDatabaseKey = loadedFiles.some((file) => file.keys.includes('DATABASE_URL'))
  const typoKey = loadedFiles.flatMap((file) => file.keys).find((key) => /database/i.test(key) && key !== 'DATABASE_URL')

  const lines = [
    'DATABASE_URL is not set for this migration command.',
    '',
    `Checked folders: ${roots.join(' | ')}`,
    ...envChecks.flatMap(({ name, existing }) =>
      existing.length > 0
        ? [`${name}: found at ${existing.join(', ')}`]
        : [`${name}: not found`]
    )
  ]

  if (foundDatabaseKey) {
    lines.push('', 'DATABASE_URL line exists but value may be empty — open .env and check the line has no spaces before the key.')
  } else if (typoKey) {
    lines.push('', `Found similar key "${typoKey}" — rename it to DATABASE_URL (exact spelling).`)
  } else if (loadedFiles.length > 0) {
    lines.push('', 'Env files were read but no DATABASE_URL key was found inside them.')
  } else {
    lines.push('', 'No .env file was found. Your app on Vercel uses Vercel env vars; locally you still need DATABASE_URL in .env for migrate scripts.')
  }

  lines.push(
    '',
    'Quick fix — run SQL in Neon (no .env needed):',
    '  ALTER TABLE sales ALTER COLUMN quantity TYPE NUMERIC(14,3) USING quantity::numeric;',
    '  ALTER TABLE products ALTER COLUMN stock_quantity TYPE NUMERIC(14,3) USING stock_quantity::numeric;',
    '',
    'Or pass Vercel URL directly:',
    '  node scripts/migrate-decimal-sales.js "postgresql://..."'
  )

  throw new Error(lines.join('\n'))
}

module.exports = { loadProjectEnv, requireDatabaseUrl, PROJECT_ROOT }
