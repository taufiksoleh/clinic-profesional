'use client'
import { bookingConfirmationSchema, type BookingConfirmation } from '@/lib/booking'
import type { PublicSchedule } from '@/lib/content'
import { useEffect, useState } from 'react'

export function useBookingSubmission(selectedSchedule: PublicSchedule | undefined, date: string) {
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null)
  const [requestId, setRequestId] = useState('')
  useEffect(() => setRequestId(crypto.randomUUID()), [])
  async function submitBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (!selectedSchedule) {
      setError('Pilih jadwal konsultasi terlebih dahulu.')
      return
    }
    setIsSubmitting(true)
    const formData = new FormData(event.currentTarget)
    let attribution = {}
    try {
      attribution = JSON.parse(sessionStorage.getItem('clinic-attribution') || '{}')
    } catch {}
    try {
      const response = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          name: formData.get('name'),
          phone: formData.get('phone'),
          scheduleId: selectedSchedule.id,
          date,
          consent: formData.get('consent') === 'on',
          website: formData.get('website'),
          analyticsConsent: localStorage.getItem('clinic-analytics') === 'yes',
          attribution,
        }),
      })
      const body = await response.json()
      if (!response.ok) throw Error(body.error)
      const confirmation = bookingConfirmationSchema.safeParse(body)
      if (!confirmation.success) throw new Error('Respons booking tidak valid. Silakan coba lagi.')
      setConfirmation(confirmation.data)
      window.dispatchEvent(
        new CustomEvent('clinic-event', {
          detail: { name: 'booking', eventId: confirmation.data.reference },
        }),
      )
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }
  return { error, isSubmitting, confirmation, requestId, submitBooking }
}
