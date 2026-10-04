import { createHash } from 'node:crypto'
import type { Booking } from '@/payload-types'
import { getSiteUrl } from '@/lib/site'
import type { getMetaNotificationConfig } from '@/server/config'
import { DeliveryFailedError } from './delivery'

export async function sendBookingMetaEvent(
  booking: Booking,
  config: NonNullable<ReturnType<typeof getMetaNotificationConfig>>,
) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/${config.apiVersion}/${config.pixelId}/events`,
      {
        method: 'POST',
        signal: AbortSignal.timeout(8000),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: config.token,
          data: [
            {
              event_name: 'booking',
              event_time: Math.floor(new Date(booking.createdAt).getTime() / 1000),
              event_id: booking.reference,
              action_source: 'website',
              event_source_url: getSiteUrl() + '/booking',
              user_data: {
                external_id: [createHash('sha256').update(booking.requestId).digest('hex')],
              },
            },
          ],
        }),
      },
    )
    if (!response.ok) throw new Error('Meta rejected the delivery.')
  } catch {
    // The same event ID is reused so Meta can deduplicate retries.
    throw new DeliveryFailedError('Meta event delivery failed.')
  }
}
