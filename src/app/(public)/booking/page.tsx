import styles from '@/components/booking/Booking.module.css'
import { getPageMetadata } from '@/server/content/metadata'

import { BookingForm } from '@/components/BookingForm'
import { getPublicSchedules } from '@/server/content/queries'
import { CalendarDays } from 'lucide-react'
export const revalidate = 60
export const generateMetadata = () => getPageMetadata('/booking')

export default async function BookingPage() {
  return (
    <section className="container section">
      <div className="page-intro">
        <span className="eyebrow">Konsultasi, dengan lebih mudah</span>
        <h1>
          Mari atur waktu
          <br />
          untuk Anda.
        </h1>
        <p>
          Pilih layanan, dokter, dan waktu praktik. Biaya konsultasi ditampilkan sebelum Anda
          mengirim permintaan.
        </p>
      </div>
      <div className={styles['booking-page']}>
        <BookingForm schedules={await getPublicSchedules()} />
        <aside className={styles['aside-blue']}>
          <CalendarDays size={32} />
          <h2>
            Langkah kecil.
            <br />
            Awal yang berarti.
          </h2>
          <ol>
            <li>Pilih jadwal yang sesuai.</li>
            <li>Kirim nama dan nomor WhatsApp.</li>
            <li>Tunggu konfirmasi dari admin.</li>
          </ol>
          <p>Jadwal pada form adalah permintaan, bukan reservasi slot otomatis.</p>
        </aside>
      </div>
    </section>
  )
}
