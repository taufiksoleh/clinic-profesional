import type { ServiceDetail } from '@/lib/content'
import { getPublicSchedules, getPublishedArticles } from '@/server/content/queries'
import { ContentPage } from './ContentPage'
import { MedicalReview } from './MedicalReview'
import { RelatedCards } from './RelatedCards'
import { ScheduleTable } from './ScheduleTable'
import { ScheduleBooking } from './ScheduleBooking'

export async function ServicePage({ service }: { service: ServiceDetail }) {
  const [schedules, articles] = await Promise.all([
    getPublicSchedules({ service: service.id }),
    getPublishedArticles({ serviceIds: [service.id] }),
  ])
  const doctors = [
    ...new Map(schedules.map((schedule) => [schedule.doctor.id, schedule.doctor])).values(),
  ]
  return (
    <ContentPage
      doc={service}
      category="layanan"
      headerExtra={<MedicalReview {...service} />}
      hasSchedules={!!schedules.length}
      afterContent={
        <>
          <RelatedCards title="Dokter terkait" documents={doctors} category="dokter" />
          <RelatedCards title="Baca juga" documents={articles} category="blog" />
          <ScheduleBooking schedules={schedules} initialService={service.id} />
        </>
      }
    >
      <ScheduleTable schedules={schedules} />
    </ContentPage>
  )
}
