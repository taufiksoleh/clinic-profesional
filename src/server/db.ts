import pg from 'pg'
const globalForDB = globalThis as unknown as { clinicPool?: pg.Pool }
export const pool = (globalForDB.clinicPool ||= new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
}))
let schemaReady: Promise<unknown> | undefined
export async function rateLimit(key: string, limit = 8, seconds = 600) {
  schemaReady ||= pool.query(
    `CREATE SCHEMA IF NOT EXISTS clinic_runtime;
     CREATE TABLE IF NOT EXISTS clinic_runtime.clinic_rate_limits (
       key text PRIMARY KEY,
       count integer NOT NULL,
       reset_at timestamptz NOT NULL
     )`,
  )
  try {
    await schemaReady
  } catch (error) {
    schemaReady = undefined
    throw error
  }
  const { rows } = await pool.query(
    `INSERT INTO clinic_runtime.clinic_rate_limits (key, count, reset_at)
     VALUES ($1, 1, NOW() + ($2 * interval '1 second'))
     ON CONFLICT (key) DO UPDATE SET
       count = CASE
         WHEN clinic_runtime.clinic_rate_limits.reset_at < NOW() THEN 1
         ELSE clinic_runtime.clinic_rate_limits.count + 1
       END,
       reset_at = CASE
         WHEN clinic_runtime.clinic_rate_limits.reset_at < NOW()
           THEN NOW() + ($2 * interval '1 second')
         ELSE clinic_runtime.clinic_rate_limits.reset_at
       END
     RETURNING count`,
    [key, seconds],
  )
  return rows[0].count <= limit
}
