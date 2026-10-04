import type { PublicSchedule } from '@/lib/content'
import { days } from '@/lib/constants'
import { money } from '@/lib/seo'
import Link from 'next/link'

export function ScheduleTable({ schedules }: { schedules: PublicSchedule[] }) {
  if (!schedules.length) return null
  return (
    <section id="jadwal">
      <h2>Jadwal & biaya konsultasi</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Dokter & lokasi</th>
              <th>Hari / waktu</th>
              <th>Biaya</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((schedule) => (
              <tr key={schedule.id}>
                <td>
                  <Link href={`/dokter/${schedule.doctor.slug}`}>{schedule.doctor.title}</Link>
                  <small>
                    <Link href={`/lokasi/${schedule.location.slug}`}>
                      {schedule.location.title}
                    </Link>
                  </small>
                </td>
                <td>
                  {days[schedule.day]}
                  <small>
                    {schedule.start}–{schedule.end} WIB
                  </small>
                </td>
                <td>{money(schedule.fee)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
