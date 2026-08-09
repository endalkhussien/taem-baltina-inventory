const { loadProjectEnv, PROJECT_ROOT, requireDatabaseUrl } = require('./load-env')

const loaded = loadProjectEnv()
const url = process.env.DATABASE_URL

console.log('Project root:', PROJECT_ROOT)
console.log('Current folder:', process.cwd())
console.log('')

if (loaded.length === 0) {
  console.log('No .env files found.')
} else {
  console.log('Env files read:')
  for (const file of loaded) {
    const hasDb = file.keys.includes('DATABASE_URL')
    console.log(`  - ${file.path}`)
    console.log(`    keys: ${file.keys.join(', ') || '(none)'}`)
    console.log(`    DATABASE_URL: ${hasDb ? 'present' : 'missing'}`)
  }
}

console.log('')
if (url?.trim()) {
  const masked = url.replace(/:([^:@/]+)@/, ':***@')
  console.log('OK — DATABASE_URL is set:', masked)
  process.exit(0)
}

console.log('DATABASE_URL is NOT set for Node scripts.')
console.log('')
console.log('Note: Vercel env vars work on the deployed site only.')
console.log('For local migrate commands, put DATABASE_URL in .env next to package.json')
console.log('(same value as Vercel → Settings → Environment Variables).')
process.exit(1)
