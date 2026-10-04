import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  bookingSchema,
  bookingConfirmationSchema,
  getBookingDateRange,
  normalizePhone,
  isBookingDateAllowed,
  csvCell,
} from '../../src/lib/booking'
import { safeInternalPath, jsonLd } from '../../src/lib/seo'
test('booking rejects missing consent, malformed phone and noninteger schedule', () => {
  const body = {
    requestId: crypto.randomUUID(),
    name: 'Pasien Contoh',
    phone: '081234567890',
    scheduleId: 1,
    date: '2026-10-05',
    consent: true,
  }
  assert.equal(bookingSchema.safeParse(body).success, true)
  for (const patch of [{ consent: false }, { phone: 'hello' }, { scheduleId: 1.2 }, { name: 'x' }])
    assert.equal(bookingSchema.safeParse({ ...body, ...patch }).success, false)
})
test('booking dates enforce Jakarta calendar and correct practice day', () => {
  const now = new Date('2026-10-04T16:00:00Z')
  assert(isBookingDateAllowed('2026-10-05', 1, now))
  assert(!isBookingDateAllowed('2026-10-05', 2, now))
  assert(!isBookingDateAllowed('2026-10-03', 6, now))
  assert(!isBookingDateAllowed('2027-10-05', 2, now))
  assert(!isBookingDateAllowed('2026-02-31', 2, now))
  assert(!isBookingDateAllowed('2026-10-04', 0, now, '12:00'))
})
test('normalization, CSV formula and JSON-LD injection protection', () => {
  assert.equal(normalizePhone('+6281234567890'), '6281234567890')
  assert.equal(normalizePhone('081234567890'), '6281234567890')
  assert.equal(csvCell('=CMD()'), '"\'=CMD()"')
  assert.equal(csvCell('a"b'), '"a""b"')
  assert(!jsonLd({ a: '</script>' }).includes('<'))
})
test('redirects cannot escape origin or target admin routes', () => {
  assert(safeInternalPath('/blog/contoh'))
  for (const path of [
    '//evil.com',
    'https://evil.com',
    '/admin',
    '/api/bookings',
    '/a?x=1',
    '/a\\b',
  ])
    assert(!safeInternalPath(path))
})

test('form and server agree on the inclusive 90-day Jakarta calendar limit', () => {
  const now = new Date('2026-10-04T05:00:00Z')
  assert.deepEqual(getBookingDateRange(now), { min: '2026-10-04', max: '2027-01-02' })
  assert(isBookingDateAllowed('2027-01-01', 5, now))
  assert(isBookingDateAllowed('2027-01-02', 6, now))
  assert(!isBookingDateAllowed('2027-01-03', 0, now))
  const jakartaMidnight = new Date('2026-10-04T17:00:00Z')
  assert.equal(getBookingDateRange(jakartaMidnight).min, '2026-10-05')
  assert(!isBookingDateAllowed('2026-10-04', 0, jakartaMidnight))
  assert(isBookingDateAllowed('2026-10-05', 1, jakartaMidnight, '09:00'))
  assert(!isBookingDateAllowed('2026-10-05', 1, new Date('2026-10-05T02:00:00Z'), '09:00'))
})

test('confirmation contract rejects missing references and malformed WhatsApp URLs', () => {
  assert(
    bookingConfirmationSchema.safeParse({ reference: 'KG-123456ABCDEF', whatsappUrl: null })
      .success,
  )
  for (const response of [
    {},
    { reference: 'wrong', whatsappUrl: null },
    { reference: 'KG-123456ABCDEF', whatsappUrl: 'not a URL' },
  ]) {
    assert(!bookingConfirmationSchema.safeParse(response).success)
  }
})
