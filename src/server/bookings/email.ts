import type { Booking } from '@/payload-types'
import type { Payload } from 'payload'
import { getSiteUrl } from '@/lib/site'
import { DeliveryFailedError } from './delivery'

export async function sendBookingEmail(payload: Payload, booking: Booking, recipient: string) {
  try {
    await payload.sendEmail({
      to: recipient,
      subject: `Booking baru ${booking.reference}`,
      text: `Permintaan konsultasi baru telah tersimpan.\nReferensi: ${booking.reference}\nTanggal: ${booking.date}\nBuka panel admin untuk melihat detail dan menghubungi pasien: ${getSiteUrl()}/admin/collections/bookings/${booking.id}\n`,
    })
  } catch (error) {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      ['EDNS', 'ECONNECTION', 'EAUTH', 'EENVELOPE'].includes(String(error.code))
    ) {
      throw new DeliveryFailedError('SMTP rejected the delivery before sending.')
    }
    throw error
  }
}
