import type { Booking } from '@/payload-types'
import type { Payload, Where } from 'payload'
import { getEmailNotificationConfig, getMetaNotificationConfig } from '@/server/config'
import { deliverNotification, type Delivery } from './delivery'
import { sendBookingEmail } from './email'
import { sendBookingMetaEvent } from './meta'

function pendingChannel(
  status: 'notificationStatus' | 'metaStatus',
  delivery: 'emailDelivery' | 'metaDelivery',
  now: Date,
): Where {
  return {
    or: [
      { [status]: { equals: 'pending' } },
      {
        and: [
          { [status]: { equals: 'sending' } },
          {
            or: [
              {
                [`${delivery}.lastAttemptAt`]: {
                  less_than_equal: new Date(now.getTime() - 120000).toISOString(),
                },
              },
              { [`${delivery}.lastAttemptAt`]: { exists: false } },
            ],
          },
        ],
      },
      {
        and: [
          { [status]: { equals: 'failed' } },
          {
            or: [
              { [`${delivery}.attempts`]: { less_than: 5 } },
              { [`${delivery}.attempts`]: { exists: false } },
            ],
          },
          {
            or: [
              { [`${delivery}.nextAttemptAt`]: { less_than_equal: now.toISOString() } },
              { [`${delivery}.nextAttemptAt`]: { exists: false } },
            ],
          },
        ],
      },
    ],
  }
}

export async function sendPendingBookingNotifications(payload: Payload) {
  const email = getEmailNotificationConfig()
  const meta = getMetaNotificationConfig()
  const now = new Date()
  const channels: Where[] = []
  if (email) channels.push(pendingChannel('notificationStatus', 'emailDelivery', now))
  if (meta)
    channels.push({
      and: [
        { analyticsConsent: { equals: true } },
        pendingChannel('metaStatus', 'metaDelivery', now),
      ],
    })
  if (!channels.length) return { processed: 0, emailsDelivered: 0 }
  const pendingBookings = await payload.find({
    collection: 'bookings',
    where: { or: channels },
    limit: 25,
    depth: 0,
    sort: 'updatedAt',
  })
  let processed = 0
  let emailsDelivered = 0
  const deadline = Date.now() + 30000
  for (const booking of pendingBookings.docs) {
    if (Date.now() > deadline) break
    if (email) {
      const delivered = await processChannel(payload, booking, 'email', () =>
        sendBookingEmail(payload, booking, email.recipient),
      )
      if (delivered) emailsDelivered++
    }
    if (meta && booking.analyticsConsent)
      await processChannel(payload, booking, 'meta', () => sendBookingMetaEvent(booking, meta))
    processed++
  }
  return { processed, emailsDelivered }
}

async function processChannel(
  payload: Payload,
  booking: Booking,
  channel: 'email' | 'meta',
  send: () => Promise<void>,
) {
  const statusField = channel === 'email' ? 'notificationStatus' : 'metaStatus'
  const deliveryField = channel === 'email' ? 'emailDelivery' : 'metaDelivery'
  const details = booking[deliveryField]
  const delivery: Delivery = {
    status: booking[statusField] || 'disabled',
    attempts: details?.attempts || 0,
    lastAttemptAt: details?.lastAttemptAt,
    nextAttemptAt: details?.nextAttemptAt,
    lastError: details?.lastError,
  }
  return deliverNotification(delivery, {
    send,
    save: async ({ status, ...details }) => {
      await payload.update({
        collection: 'bookings',
        id: booking.id,
        data: { [statusField]: status, [deliveryField]: details },
      })
    },
  })
}
