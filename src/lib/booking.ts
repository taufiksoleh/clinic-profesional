import { z } from 'zod'

export const bookingPhonePattern = String.raw`(\+62|62|0)8[0-9]{7,12}`
const bookingWindowDays = 90
const jakartaTimeZone = 'Asia/Jakarta'
export const bookingSchema = z.object({
  requestId: z.uuid(),
  name: z.string().trim().min(2).max(100),
  phone: z
    .string()
    .trim()
    .regex(new RegExp(`^${bookingPhonePattern}$`)),
  scheduleId: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  consent: z.literal(true),
  analyticsConsent: z.boolean().default(false),
  website: z.string().max(0).optional(),
  attribution: z
    .object({
      source: z.string().max(100).optional(),
      medium: z.string().max(100).optional(),
      campaign: z.string().max(150).optional(),
      referrer: z.string().max(200).optional(),
    })
    .optional(),
})
export type BookingInput = z.infer<typeof bookingSchema>
export function normalizePhone(phone: string) {
  return phone.replace(/^\+/, '').replace(/^0/, '62')
}
export const bookingConfirmationSchema = z.object({
  reference: z.string().regex(/^KG-[A-F0-9]{12}$/),
  whatsappUrl: z.url().nullable(),
})
export type BookingConfirmation = z.infer<typeof bookingConfirmationSchema>

export function getJakartaDate(date: Date) {
  return date.toLocaleDateString('en-CA', { timeZone: jakartaTimeZone })
}

export function getBookingDateRange(now = new Date()) {
  return {
    min: getJakartaDate(now),
    max: getJakartaDate(new Date(now.getTime() + bookingWindowDays * 86400000)),
  }
}

export function isBookingDateAllowed(date: string, day: number, now = new Date(), end?: string) {
  const bookingDate = new Date(`${date}T12:00:00+07:00`)
  if (!Number.isFinite(bookingDate.getTime()) || getJakartaDate(bookingDate) !== date) return false
  const { min, max } = getBookingDateRange(now)
  if (date < min || date > max || bookingDate.getUTCDay() !== day) return false
  if (end && date === min) {
    const currentTime = now.toLocaleTimeString('en-GB', {
      timeZone: jakartaTimeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
    if (currentTime >= end) return false
  }
  return true
}
export function csvCell(value: unknown) {
  const text = String(value ?? '')
  return '"' + (/^(?:\s*[=+@-]|[\t\r])/.test(text) ? "'" + text : text).replace(/"/g, '""') + '"'
}
