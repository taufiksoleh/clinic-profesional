import { getPageMetadata } from '@/server/content/metadata'

import { NetworkMap } from '@/components/NetworkMap'
import {
  getClinicSettings,
  getPublicSchedules,
  getPublishedContent,
} from '@/server/content/queries'
import Link from 'next/link'
export const revalidate = 60
export const generateMetadata = () => getPageMetadata('/kontak')

export default async function ContactPage() {
  const clinicSettings = await getClinicSettings()
  return (
    <section className="container section">
      <div className="page-intro">
        <span className="eyebrow">Hubungi kami</span>
        <h1>
          Ada yang ingin
          <br />
          Anda tanyakan?
        </h1>
        <p>Tim admin membantu Anda menemukan informasi layanan dan mengatur konsultasi.</p>
      </div>
      <div className="cards">
        <div className="card card-body">
          <h2>Kontak klinik</h2>
          {clinicSettings.phone ? (
            <a href={`tel:${clinicSettings.phone}`}>{clinicSettings.phone}</a>
          ) : (
            <p>Nomor kontak belum diatur.</p>
          )}
          {clinicSettings.email && (
            <a href={`mailto:${clinicSettings.email}`}>{clinicSettings.email}</a>
          )}
          <p>{clinicSettings.address}</p>
        </div>
        <div className="card card-body">
          <h2>Konsultasi terjadwal</h2>
          <p>Pilih dokter, lokasi, dan jadwal melalui form booking.</p>
          <Link className="button" href="/booking">
            Buat janji
          </Link>
        </div>
      </div>
      <div className="section">
        <NetworkMap
          locations={await getPublishedContent('locations')}
          schedules={await getPublicSchedules()}
        />
      </div>
    </section>
  )
}
