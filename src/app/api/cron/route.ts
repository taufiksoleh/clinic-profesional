import { pool } from '@/server/db'
import { sendPendingBookingNotifications } from '@/server/bookings/notifications'
import { getCMS } from '@/server/cms'
import { timingSafeEqual } from 'node:crypto'
export const dynamic = 'force-dynamic'
export const maxDuration = 60
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const value = request.headers.get('authorization') || ''
  const expected = `Bearer ${secret}`
  if (
    !secret ||
    Buffer.byteLength(value) !== Buffer.byteLength(expected) ||
    !timingSafeEqual(Buffer.from(value), Buffer.from(expected))
  )
    return new Response('Unauthorized', { status: 401 })
  const connection = await pool.connect()
  try {
    const lock = await connection.query('SELECT pg_try_advisory_lock(482913701) AS locked')
    if (!lock.rows[0].locked) return Response.json({ running: true }, { status: 409 })
    const payload = await getCMS()
    await payload.jobs.run({ limit: 25 })
    const notifications = await sendPendingBookingNotifications(payload)
    await pool
      .query(
        "DELETE FROM clinic_runtime.clinic_rate_limits WHERE reset_at < NOW() - interval '1 day'",
      )
      .catch(() => {})
    return Response.json(notifications)
  } finally {
    try {
      await connection.query('SELECT pg_advisory_unlock(482913701)')
    } finally {
      connection.release()
    }
  }
}
