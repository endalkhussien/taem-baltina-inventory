// Skip git hook install on CI and Vercel so `npm ci` / `npm install` never fails the deploy.
if (process.env.CI || process.env.VERCEL || process.env.HUSKY === '0') {
  process.exit(0)
}

const { execSync } = require('child_process')

try {
  execSync('husky install', { stdio: 'inherit' })
} catch {
  process.exit(0)
}
