export function resolveDatabaseUrl() {
  const url = process.env.DATABASE_URL

  if (!url) {
    const isNextBuild = process.env.NEXT_PHASE === 'phase-production-build'

    if (process.env.NODE_ENV === 'production' && !isNextBuild) {
      throw new Error('DATABASE_URL environment variable is required in production.')
    }

    return 'postgresql://postgres:postgres@localhost:5432/taem_baltina_dev'
  }

  return url
}

export function requiresDatabaseSsl(connectionString: string) {
  return /sslmode=require|neon\.tech|supabase\.co/i.test(connectionString)
}

export function createPgPoolOptions(connectionString: string) {
  return {
    connectionString,
    max: Number(process.env.PG_POOL_MAX || 3),
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    ssl: requiresDatabaseSsl(connectionString) ? { rejectUnauthorized: false } : undefined
  }
}
