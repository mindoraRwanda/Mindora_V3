import pg from 'pg'

const { Pool } = pg

async function main() {
  const connectionString = process.env.AI_DATABASE_URL ?? 'postgresql://mindora:mindora@localhost:5432/mindora_ai'
  console.log('Connecting to:', connectionString.replace(/:.*@/, ':***@'))

  const pool = new Pool({ connectionString, connectionTimeoutMillis: 5000 })
  try {
    const result = await pool.query('SELECT 1 AS n')
    console.log('pg Pool: CONNECTED — result:', result.rows[0])
    await pool.end()
    process.exit(0)
  } catch (e: unknown) {
    const err = e as Error
    console.error('pg Pool ERROR:', err.message)
    await pool.end().catch(() => {})
    process.exit(1)
  }
}

main()
