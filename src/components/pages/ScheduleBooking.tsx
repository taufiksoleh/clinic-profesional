import { BookingForm } from '@/components/BookingForm'
import type { PublicSchedule } from '@/lib/content'

export function ScheduleBooking({
  schedules,
  initialDoctor,
  initialService,
}: {
  schedules: PublicSchedule[]
  initialDoctor?: number
  initialService?: number
}) {
  if (!schedules.length) return null
  return (
    <section id="booking" className="section">
      <h2>Ajukan konsultasi</h2>
      <BookingForm
        schedules={schedules}
        initialDoctor={initialDoctor}
        initialService={initialService}
      />
    </section>
  )
}
