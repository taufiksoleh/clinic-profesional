import { getEmailNotificationConfig, getMetaNotificationConfig } from '@/server/config'
import {
  normalizePhone,
  isBookingDateAllowed,
  type BookingConfirmation,
  type BookingInput,
} from '@/lib/booking'
import { hasPublishedRelationships } from '@/lib/content'
import { rateLimit } from '@/server/db'
import { getCMS } from '@/server/cms'
import { createHash, randomBytes } from 'node:crypto'

export class BookingError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'BookingError'
  }
}

export async function createBooking(input: BookingInput) {
  const phoneHash = createHash('sha256').update(normalizePhone(input.phone)).digest('hex')
  if (!(await rateLimit(`booking:${phoneHash}`)))
    throw new BookingError('Terlalu banyak percobaan. Coba lagi dalam 10 menit.', 429)
  if (!(await rateLimit('booking-global', 120, 60)))
    throw new BookingError('Layanan sedang sibuk. Coba lagi sebentar.', 429)
  const payload = await getCMS()
  const existingBookings = await payload.find({
    collection: 'bookings',
    where: { requestId: { equals: input.requestId } },
    limit: 1,
    depth: 0,
  })
  if (existingBookings.docs[0]) {
    if (existingBookings.docs[0].phone !== normalizePhone(input.phone))
      throw new BookingError('Permintaan tidak valid.', 409)
    return bookingConfirmation(existingBookings.docs[0].reference)
  }
  const matchingSchedules = await payload.find({
    collection: 'schedules',
    where: { id: { equals: input.scheduleId } },
    limit: 1,
    depth: 2,
    overrideAccess: false,
  })
  const schedule = matchingSchedules.docs[0]
  if (
    !schedule ||
    !schedule.active ||
    !hasPublishedRelationships(schedule) ||
    !isBookingDateAllowed(input.date, schedule.day, new Date(), schedule.end)
  )
    throw new BookingError('Jadwal tidak tersedia pada tanggal tersebut. Pilih ulang jadwal.', 400)
  const clinicSettings = await payload.findGlobal({ slug: 'settings' })
  const reference = `KG-${randomBytes(6).toString('hex').toUpperCase()}`
  try {
    await payload.create({
      collection: 'bookings',
      data: {
        reference,
        requestId: input.requestId,
        name: input.name,
        phone: normalizePhone(input.phone),
        schedule: schedule.id,
        date: input.date,
        fee: schedule.fee,
        details: `${schedule.service.title} · ${schedule.doctor.title} · ${schedule.location.title} · ${schedule.start}–${schedule.end}`,
        status: 'new',
        source: input.attribution?.source || input.attribution?.referrer || 'direct',
        attribution: input.attribution,
        consentAt: new Date().toISOString(),
        privacyVersion: clinicSettings.privacyVersion || '2026-10-04',
        analyticsConsent: input.analyticsConsent,
        notificationStatus: getEmailNotificationConfig() ? 'pending' : 'disabled',
        metaStatus: input.analyticsConsent && getMetaNotificationConfig() ? 'pending' : 'disabled',
      },
    })
  } catch (error) {
    const duplicateBookings = await payload.find({
      collection: 'bookings',
      where: { requestId: { equals: input.requestId } },
      limit: 1,
    })
    if (duplicateBookings.docs[0]?.phone === normalizePhone(input.phone))
      return bookingConfirmation(String(duplicateBookings.docs[0].reference))
    throw error
  }
  return bookingConfirmation(reference)
}
function bookingConfirmation(reference: string): BookingConfirmation {
  const phone = process.env.WHATSAPP_NUMBER
  return {
    reference,
    whatsappUrl:
      phone && /^62\d{8,13}$/.test(phone)
        ? `https://wa.me/${phone}?text=${encodeURIComponent(`Halo, saya ingin melanjutkan permintaan konsultasi ${reference}. Mohon konfirmasi jadwal.`)}`
        : null,
  }
}
