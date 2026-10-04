'use client'
import styles from './booking/Booking.module.css'
import { bookingPhonePattern, getBookingDateRange } from '@/lib/booking'
import { days } from '@/lib/constants'
import type { PublicSchedule } from '@/lib/content'
import { money } from '@/lib/seo'
import { useState } from 'react'
import { BookingConfirmation } from './booking/BookingConfirmation'
import { useBookingSubmission } from './booking/useBookingSubmission'
export function BookingForm({
  schedules,
  initialDoctor,
  initialService,
}: {
  schedules: PublicSchedule[]
  initialDoctor?: number
  initialService?: number
}) {
  const [serviceId, setServiceId] = useState(initialService ? String(initialService) : '')
  const [doctorId, setDoctorId] = useState(initialDoctor ? String(initialDoctor) : '')
  const [locationId, setLocationId] = useState('')
  const [scheduleId, setScheduleId] = useState('')
  const dateRange = getBookingDateRange()
  const [date, setDate] = useState('')
  const availableSchedules = schedules.filter(
    (scheduleOption) =>
      (!serviceId || String(scheduleOption.service.id) === serviceId) &&
      (!doctorId || String(scheduleOption.doctor.id) === doctorId) &&
      (!locationId || String(scheduleOption.location.id) === locationId),
  )
  const selectedSchedule = availableSchedules.find(
    (scheduleOption) => String(scheduleOption.id) === scheduleId,
  )
  const getScheduleOptions = (key: 'doctor' | 'location' | 'service', list = schedules) => [
    ...new Map(
      list.map((scheduleOption) => [scheduleOption[key].id, scheduleOption[key]]),
    ).values(),
  ]
  const { error, isSubmitting, confirmation, requestId, submitBooking } = useBookingSubmission(
    selectedSchedule,
    date,
  )
  if (confirmation) return <BookingConfirmation confirmation={confirmation} />
  return (
    <form onSubmit={submitBooking} className={styles['booking-form']}>
      <div className={styles['form-grid']}>
        <label>
          Layanan
          <select
            value={serviceId}
            onChange={(event) => {
              setServiceId(event.target.value)
              setScheduleId('')
            }}
          >
            <option value="">Semua layanan</option>
            {getScheduleOptions('service').map((option) => (
              <option key={option.id} value={option.id}>
                {option.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Dokter
          <select
            value={doctorId}
            onChange={(event) => {
              setDoctorId(event.target.value)
              setScheduleId('')
            }}
          >
            <option value="">Semua dokter</option>
            {getScheduleOptions('doctor').map((option) => (
              <option key={option.id} value={option.id}>
                {option.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Lokasi
          <select
            value={locationId}
            onChange={(event) => {
              setLocationId(event.target.value)
              setScheduleId('')
            }}
          >
            <option value="">Semua lokasi</option>
            {getScheduleOptions('location').map((option) => (
              <option key={option.id} value={option.id}>
                {option.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Jadwal praktik
          <select
            required
            value={scheduleId}
            onChange={(event) => {
              setScheduleId(event.target.value)
              setDate('')
            }}
          >
            <option value="">Pilih jadwal</option>
            {availableSchedules.map((scheduleOption) => (
              <option key={scheduleOption.id} value={scheduleOption.id}>
                {days[scheduleOption.day]}, {scheduleOption.start} · {scheduleOption.doctor.title} ·{' '}
                {scheduleOption.location.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tanggal yang diinginkan
          <input
            type="date"
            required
            value={date}
            max={dateRange.max}
            min={dateRange.min}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>
        <div className={styles['fee']}>
          <span>Biaya konsultasi</span>
          <strong>{selectedSchedule ? money(selectedSchedule.fee) : 'Pilih jadwal'}</strong>
          <small>Biaya tindakan tambahan dikonfirmasi terpisah.</small>
        </div>
        <label>
          Nama lengkap
          <input name="name" autoComplete="name" required minLength={2} maxLength={100} />
        </label>
        <label>
          Nomor WhatsApp
          <input
            name="phone"
            autoComplete="tel"
            type="tel"
            inputMode="tel"
            placeholder="08xxxxxxxxxx"
            required
            pattern={bookingPhonePattern}
          />
        </label>
      </div>
      <div className={styles['honeypot']} aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {!availableSchedules.length && (
        <p role="status">Belum ada jadwal untuk pilihan ini. Ubah filter Anda.</p>
      )}
      <label className={styles['checkbox']}>
        <input type="checkbox" name="consent" required />
        <span>
          Saya menyetujui pemrosesan data untuk tindak lanjut konsultasi sesuai{' '}
          <a href="/kebijakan-privasi">Kebijakan Privasi</a>.
        </span>
      </label>
      {error && (
        <p className={styles['form-error']} role="alert">
          {error}
        </p>
      )}
      <button
        className="button"
        disabled={isSubmitting || !requestId || !availableSchedules.length}
      >
        {isSubmitting ? 'Menyimpan…' : 'Ajukan konsultasi'}
      </button>
      <p className="caption">
        Permintaan jadwal akan dikonfirmasi oleh admin. Form ini bukan layanan darurat.
      </p>
    </form>
  )
}
