'use client'
import styles from './Booking.module.css'
import type { BookingConfirmation as Confirmation } from '@/lib/booking'
export function BookingConfirmation({ confirmation }: { confirmation: Confirmation }) {
  return (
    <div className={styles['booking-success']} role="status">
      <span className="eyebrow">Permintaan tersimpan</span>
      <h2>Terima kasih. Kami akan menghubungi Anda.</h2>
      <p>
        Nomor referensi <strong>{confirmation.reference}</strong>. Jadwal belum terkonfirmasi sampai
        admin menghubungi Anda.
      </p>
      {confirmation.whatsappUrl ? (
        <a
          className="button"
          href={confirmation.whatsappUrl}
          onClick={() =>
            window.dispatchEvent(
              new CustomEvent('clinic-event', { detail: { name: 'whatsapp_click' } }),
            )
          }
        >
          Lanjutkan di WhatsApp
        </a>
      ) : (
        <p>Admin akan menindaklanjuti melalui nomor WhatsApp yang Anda masukkan.</p>
      )}
    </div>
  )
}
