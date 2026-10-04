'use client'
import { getPublicConfig } from '@/lib/public-config'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
declare global {
  interface Window {
    dataLayer: unknown[]
    gtag?: (...args: unknown[]) => void
    fbq?: ((...args: unknown[]) => void) & {
      queue?: unknown[]
      callMethod?: (...args: unknown[]) => void
      push?: unknown
      loaded?: boolean
      version?: string
    }
  }
}
export function Analytics() {
  const [choice, setChoice] = useState<string | null>('loading')
  const path = usePathname()
  useEffect(() => {
    setChoice(localStorage.getItem('clinic-analytics'))
    if (!sessionStorage.getItem('clinic-attribution')) {
      const searchParams = new URLSearchParams(location.search)
      let referrerHost = ''
      try {
        referrerHost = document.referrer ? new URL(document.referrer).hostname : ''
      } catch {}
      sessionStorage.setItem(
        'clinic-attribution',
        JSON.stringify({
          source: searchParams.get('utm_source')?.slice(0, 100) || undefined,
          medium: searchParams.get('utm_medium')?.slice(0, 100) || undefined,
          campaign: searchParams.get('utm_campaign')?.slice(0, 150) || undefined,
          referrer: referrerHost.slice(0, 200),
        }),
      )
    }
  }, [])
  useEffect(() => {
    if (choice !== 'yes') return
    const { googleAnalyticsId, metaPixelId } = getPublicConfig()
    if (googleAnalyticsId && !window.gtag) {
      window.dataLayer = window.dataLayer || []
      window.gtag = function () {
        window.dataLayer.push(arguments)
      }
      window.gtag('js', new Date())
      window.gtag('config', googleAnalyticsId, { send_page_view: false })
      const script = document.createElement('script')
      script.src = `https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`
      script.async = true
      document.head.appendChild(script)
    }
    if (metaPixelId && !window.fbq) {
      const facebookQueue: NonNullable<Window['fbq']> = function (...args) {
        if (facebookQueue.callMethod) facebookQueue.callMethod(...args)
        else facebookQueue.queue!.push(args)
      }
      facebookQueue.queue = []
      facebookQueue.loaded = true
      facebookQueue.version = '2.0'
      window.fbq = facebookQueue
      const script = document.createElement('script')
      script.src = 'https://connect.facebook.net/en_US/fbevents.js'
      script.async = true
      document.head.appendChild(script)
      facebookQueue('init', metaPixelId)
    }
    const track = (event: Event) => {
      const { name, eventId } = (event as CustomEvent).detail
      window.gtag?.('event', name, { event_id: eventId })
      window.fbq?.('trackCustom', name, {}, eventId ? { eventID: eventId } : {})
    }
    window.addEventListener('clinic-event', track)
    return () => window.removeEventListener('clinic-event', track)
  }, [choice])
  useEffect(() => {
    if (choice === 'yes') {
      window.gtag?.('event', 'page_view', { page_path: path })
      window.fbq?.('track', 'PageView')
    }
  }, [path, choice])
  const saveConsent = (value: string) => {
    localStorage.setItem('clinic-analytics', value)
    setChoice(value)
  }
  if (choice === 'loading') return null
  return choice === null ? (
    <aside className="consent" aria-label="Preferensi analitik">
      <p>
        Izinkan analitik opsional untuk membantu kami memahami penggunaan website? Booking tetap
        dapat digunakan tanpa analitik.
      </p>
      <div>
        <button onClick={() => saveConsent('no')} className="button secondary">
          Tanpa analitik
        </button>
        <button onClick={() => saveConsent('yes')} className="button">
          Izinkan
        </button>
      </div>
    </aside>
  ) : (
    <button
      className="privacy-control"
      onClick={() => {
        localStorage.removeItem('clinic-analytics')
        location.reload()
      }}
    >
      Preferensi privasi
    </button>
  )
}
