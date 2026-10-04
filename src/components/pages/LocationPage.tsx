import type { ClinicLocation } from '@/lib/content'
import { getLocationSchema } from '@/lib/structured-data'
import { getPublicSchedules } from '@/server/content/queries'
import { ContentPage } from './ContentPage'
import { ScheduleTable } from './ScheduleTable'
import { ScheduleBooking } from './ScheduleBooking'

export async function LocationPage({ location }: { location: ClinicLocation }) {
  const schedules = await getPublicSchedules({ location: location.id })
  return (
    <ContentPage
      doc={location}
      category="lokasi"
      eyebrow={location.city}
      schema={getLocationSchema(location)}
      hasSchedules={!!schedules.length}
      afterContent={<ScheduleBooking schedules={schedules} />}
    >
      <section>
        <h2>Alamat & jam praktik</h2>
        <p>{location.address}</p>
        <p>{location.hours}</p>
        <a
          className="text-link"
          href={`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`}
          target="_blank"
          rel="noreferrer"
        >
          Buka petunjuk arah
        </a>
      </section>
      <ScheduleTable schedules={schedules} />
    </ContentPage>
  )
}
