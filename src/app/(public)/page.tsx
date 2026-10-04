import { getPageMetadata } from '@/server/content/metadata'

import { ContentCard } from '@/components/ContentCard'
import { NetworkMap } from '@/components/NetworkMap'
import { jsonLd } from '@/lib/seo'
import { getSiteUrl } from '@/lib/site'
import {
  getClinicSettings,
  getPublicSchedules,
  getPublishedContent,
} from '@/server/content/queries'
import { Activity, CalendarDays, Check, MapPin, Stethoscope } from 'lucide-react'
import Link from 'next/link'
import { BookingCTA } from '@/components/pages/BookingCTA'
export const revalidate = 60
export const generateMetadata = () => getPageMetadata('/')

export default async function HomePage() {
  const [services, doctors, locations, articles, schedules, clinicSettings] = await Promise.all([
    getPublishedContent('services'),
    getPublishedContent('doctors'),
    getPublishedContent('locations'),
    getPublishedContent('articles'),
    getPublicSchedules(),
    getClinicSettings(),
  ])
  return (
    <>
      <section className="hero container">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="line" />
            Kesehatan gerak, bersama Anda
          </span>
          <h1>
            Ruang untuk
            <br />
            kembali <em>bergerak.</em>
          </h1>
          <p>
            Kenali pilihan perawatan Anda. Temukan dokter dan jadwal konsultasi yang sesuai, dengan
            biaya yang jelas sejak awal.
          </p>
          <div className="hero-actions">
            <Link href="/booking" className="button">
              Buat janji konsultasi
            </Link>
            <Link href="/dokter" className="button secondary">
              Kenali dokter kami
            </Link>
          </div>
          <div className="hero-note">
            <Check size={18} />
            <span>Informasi biaya sebelum booking</span>
          </div>
        </div>
        <div className="hero-visual">
          <img
            src="/clinic-hero.webp"
            srcSet="/clinic-hero-mobile.webp 700w, /clinic-hero.webp 1400w"
            sizes="(max-width: 800px) 100vw, 48vw"
            alt="Ilustrasi ruang konsultasi dan rehabilitasi klinik"
            width={1536}
            height={1024}
            fetchPriority="high"
          />
          <div className="hero-label">
            <Activity size={28} />
            <div>
              <strong>
                Anda didengar.
                <br />
                Pilihan dijelaskan.
              </strong>
              <span>Konsultasi dimulai dari memahami Anda.</span>
            </div>
          </div>
          <span className="image-note">Ilustrasi fasilitas</span>
        </div>
      </section>
      <div className="quicklinks container">
        <Link href="/dokter">
          <Stethoscope />
          <div>
            <strong>Temukan dokter</strong>
            <span>Keahlian & jadwal praktik</span>
          </div>
        </Link>
        <Link href="/lokasi">
          <MapPin />
          <div>
            <strong>Pilih lokasi</strong>
            <span>Alamat & jam operasional</span>
          </div>
        </Link>
        <Link href="/booking">
          <CalendarDays />
          <div>
            <strong>Atur konsultasi</strong>
            <span>Lihat jadwal & biaya</span>
          </div>
        </Link>
      </div>
      <section className="container section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Layanan kami</span>
            <h2>
              Setiap keluhan,
              <br />
              layak dipahami.
            </h2>
          </div>
          <Link href="/layanan" className="text-link">
            Lihat semua layanan
          </Link>
        </div>
        <div className="cards">
          {services.slice(0, 3).map((document) => (
            <ContentCard key={document.id} doc={document} category="layanan" />
          ))}
        </div>
      </section>
      <section className="blue-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Tim dokter</span>
              <h2>
                Kenali orang yang akan
                <br />
                mendampingi Anda.
              </h2>
            </div>
            <Link href="/dokter" className="text-link">
              Cari dokter & jadwal
            </Link>
          </div>
          <div className="cards">
            {doctors.slice(0, 3).map((document) => (
              <ContentCard key={document.id} doc={document} category="dokter" />
            ))}
          </div>
        </div>
      </section>
      <section className="container section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Lokasi praktik</span>
            <h2>Dekat dengan keseharian Anda.</h2>
          </div>
        </div>
        <NetworkMap locations={locations} schedules={schedules} />
      </section>
      <section className="container section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Pusat edukasi</span>
            <h2>Lebih paham, lebih siap.</h2>
          </div>
          <Link className="text-link" href="/blog">
            Semua artikel
          </Link>
        </div>
        <div className="cards">
          {articles.slice(0, 3).map((document) => (
            <ContentCard key={document.id} doc={document} category="blog" />
          ))}
        </div>
        {!articles.length && <p>Artikel sedang melalui tinjauan medis.</p>}
      </section>
      <BookingCTA />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            '@context': 'https://schema.org',
            '@type': 'MedicalClinic',
            name: clinicSettings.name,
            url: getSiteUrl(),
            description: clinicSettings.description,
            address: clinicSettings.address,
            telephone: clinicSettings.phone,
          }),
        }}
      />
    </>
  )
}
