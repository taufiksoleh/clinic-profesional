import { bookingSchema } from '@/lib/booking'
import { getSiteUrl } from '@/lib/site'
import { BookingError, createBooking } from '@/server/bookings/create-booking'
export async function POST(request: Request) {
  if (request.headers.get('origin') !== getSiteUrl())
    return Response.json({ error: 'Asal permintaan tidak valid.' }, { status: 403 })
  if (Number(request.headers.get('content-length') || 0) > 8000)
    return Response.json({ error: 'Data terlalu besar.' }, { status: 413 })
  let raw: string
  try {
    raw = await request.text()
    if (raw.length > 8000) throw Error()
  } catch {
    return Response.json({ error: 'Data tidak valid.' }, { status: 400 })
  }
  let parsed
  try {
    parsed = bookingSchema.safeParse(JSON.parse(raw))
  } catch {
    return Response.json({ error: 'Data tidak valid.' }, { status: 400 })
  }
  if (!parsed.success)
    return Response.json(
      { error: 'Periksa nama, nomor WhatsApp, tanggal, dan persetujuan Anda.' },
      { status: 400 },
    )
  const input = parsed.data
  try {
    return Response.json(await createBooking(input))
  } catch (error) {
    if (error instanceof BookingError)
      return Response.json({ error: error.message }, { status: error.status })
    console.error('Booking failed', error instanceof Error ? error.message : 'unknown')
    return Response.json(
      { error: 'Permintaan belum dapat disimpan. Silakan coba lagi.' },
      { status: 503 },
    )
  }
}
