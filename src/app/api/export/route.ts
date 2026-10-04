import { canExportBookings } from '@/lib/permissions'
import { csvCell } from '@/lib/booking'
import { getCMS } from '@/server/cms'
export async function GET(request: Request) {
  const payload = await getCMS()
  const { user } = await payload.auth({ headers: request.headers })
  if (!canExportBookings(user)) return new Response('Unauthorized', { status: 403 })
  const rows = [
    [
      'Referensi',
      'Nama',
      'WhatsApp',
      'Tanggal',
      'Jadwal',
      'Biaya',
      'Status',
      'Sumber',
      'Persetujuan',
    ],
  ]
  let page = 1
  do {
    const r = await payload.find({
      collection: 'bookings',
      limit: 100,
      page,
      depth: 0,
      overrideAccess: false,
      user,
    })
    for (const document of r.docs)
      rows.push(
        [
          document.reference,
          document.name,
          document.phone,
          document.date,
          document.details,
          document.fee,
          document.status,
          document.source,
          document.consentAt,
        ].map(String),
      )
    if (!r.hasNextPage) break
    page++
  } while (true)
  return new Response('\uFEFF' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="booking-klinik.csv"',
      'Cache-Control': 'no-store',
    },
  })
}
