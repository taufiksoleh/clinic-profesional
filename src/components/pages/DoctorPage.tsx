import type { DoctorProfile } from '@/lib/content'
import { getDoctorSchema } from '@/lib/structured-data'
import { getPublicSchedules, getPublishedArticles } from '@/server/content/queries'
import Link from 'next/link'
import { ContentPage } from './ContentPage'
import { RelatedCards } from './RelatedCards'
import { ScheduleTable } from './ScheduleTable'
import { ScheduleBooking } from './ScheduleBooking'

export async function DoctorPage({ doctor }: { doctor: DoctorProfile }) {
  const [schedules, articles] = await Promise.all([
    getPublicSchedules({ doctor: doctor.id }),
    getPublishedArticles({ reviewerId: doctor.id }),
  ])
  return (
    <ContentPage
      doc={doctor}
      category="dokter"
      eyebrow={doctor.specialty}
      schema={getDoctorSchema(doctor)}
      hasSchedules={!!schedules.length}
      headerExtra={
        <Link className="button" href="#booking">
          Booking dokter ini
        </Link>
      }
      afterContent={
        <>
          <RelatedCards
            title="Artikel yang ditinjau"
            documents={articles}
            category="blog"
            emptyMessage="Belum ada artikel terbit."
          />
          <ScheduleBooking schedules={schedules} initialDoctor={doctor.id} />
        </>
      }
    >
      {doctor.education && (
        <section>
          <h2>Pendidikan</h2>
          <p>{doctor.education}</p>
        </section>
      )}
      {doctor.experience && (
        <section>
          <h2>Pengalaman</h2>
          <p>{doctor.experience}</p>
        </section>
      )}
      <ScheduleTable schedules={schedules} />
    </ContentPage>
  )
}
