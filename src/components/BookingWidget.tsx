'use client'
import styles from './booking/Booking.module.css'
import type { PublicSchedule } from '@/lib/content'
import { CalendarDays, MessageCircle, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { BookingForm } from './BookingForm'
export function BookingWidget({ whatsapp }: { whatsapp?: string }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [schedules, setSchedules] = useState<PublicSchedule[] | null>(null)
  const [error, setError] = useState(false)
  async function openBookingDialog() {
    dialog.current?.showModal()
    setSchedules(null)
    setError(false)
    try {
      const response = await fetch('/api/booking-options', { cache: 'no-store' })
      if (!response.ok) throw Error()
      setSchedules(await response.json())
    } catch {
      setError(true)
    }
  }
  return (
    <>
      <div className={styles['booking-widget']}>
        <button className="button" onClick={openBookingDialog}>
          <CalendarDays size={19} />
          Buat janji
        </button>
        {whatsapp && /^62\d{8,13}$/.test(whatsapp) && (
          <a
            className={`button ${styles['whatsapp']}`}
            href={`https://wa.me/${whatsapp}`}
            aria-label="Hubungi klinik melalui WhatsApp"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent('clinic-event', { detail: { name: 'whatsapp_click' } }),
              )
            }
          >
            <MessageCircle size={20} />
            WhatsApp
          </a>
        )}
      </div>
      <dialog
        ref={dialog}
        className={styles['booking-dialog']}
        aria-labelledby="booking-dialog-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close()
        }}
      >
        <div className={styles['dialog-heading']}>
          <h2 id="booking-dialog-title">Ajukan konsultasi</h2>
          <button
            type="button"
            aria-label="Tutup form booking"
            onClick={() => dialog.current?.close()}
          >
            <X />
          </button>
        </div>
        {schedules ? (
          <BookingForm schedules={schedules} />
        ) : error ? (
          <div className="empty">
            <p>Jadwal belum dapat dimuat.</p>
            <button className="button" onClick={openBookingDialog}>
              Coba lagi
            </button>
          </div>
        ) : (
          <p role="status" className="empty">
            Memuat jadwal…
          </p>
        )}
      </dialog>
    </>
  )
}
