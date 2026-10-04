export type DeliveryStatus = 'pending' | 'sending' | 'sent' | 'disabled' | 'failed' | 'uncertain'
export type Delivery = {
  status: DeliveryStatus
  attempts: number
  lastAttemptAt?: string | null
  nextAttemptAt?: string | null
  lastError?: string | null
}
export class DeliveryFailedError extends Error {}
const maxAttempts = 5
const sendingTimeout = 2 * 60000

export async function deliverNotification(
  delivery: Delivery,
  {
    send,
    save,
    now = new Date(),
  }: {
    send: () => Promise<void>
    save: (delivery: Delivery) => Promise<void>
    now?: Date
  },
): Promise<boolean> {
  if (delivery.status === 'sending') {
    if (
      delivery.lastAttemptAt &&
      now.getTime() - new Date(delivery.lastAttemptAt).getTime() < sendingTimeout
    )
      return false
    await save({
      ...delivery,
      status: 'uncertain',
      nextAttemptAt: null,
      lastError: 'Proses terhenti. Periksa apakah notifikasi diterima sebelum mengirim ulang.',
    })
    return false
  }
  if (!['pending', 'failed'].includes(delivery.status) || delivery.attempts >= maxAttempts)
    return false
  if (delivery.nextAttemptAt && new Date(delivery.nextAttemptAt) > now) return false
  const attempt: Delivery = {
    status: 'sending',
    attempts: delivery.attempts + 1,
    lastAttemptAt: now.toISOString(),
    nextAttemptAt: null,
    lastError: null,
  }
  await save(attempt)
  try {
    await send()
  } catch (error) {
    const canRetry = error instanceof DeliveryFailedError
    await save({
      ...attempt,
      status: canRetry ? 'failed' : 'uncertain',
      nextAttemptAt:
        canRetry && attempt.attempts < maxAttempts
          ? new Date(now.getTime() + 60000 * 2 ** (attempt.attempts - 1)).toISOString()
          : null,
      lastError: canRetry
        ? 'Pengiriman gagal. Periksa konfigurasi layanan jika percobaan berikutnya tetap gagal.'
        : 'Hasil pengiriman belum dapat dipastikan. Periksa penerima sebelum mengirim ulang.',
    })
    return false
  }
  // If this write fails, the saved "sending" state prevents an automatic duplicate.
  await save({ ...attempt, status: 'sent' })
  return true
}
