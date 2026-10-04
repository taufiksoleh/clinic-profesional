import { getClinicSettings, getPublishedDocument } from '@/server/content/queries'
import { Activity } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
export async function LinksPage({ slug }: { slug?: string }) {
  const clinicSettings = await getClinicSettings()
  const document = slug ? await getPublishedDocument('doctors', slug) : null
  if (slug && !document) notFound()
  return (
    <section className="bio container">
      <span className="brand-mark">
        <Activity />
      </span>
      <h1>{document?.title || clinicSettings.name}</h1>
      <p>{document?.specialty || clinicSettings.description}</p>
      <Link className="button" href={document ? `/dokter/${document.slug}#booking` : '/booking'}>
        Buat janji konsultasi
      </Link>
      <Link className="button secondary" href="/lokasi">
        Lokasi praktik
      </Link>
      <Link className="button secondary" href="/blog">
        Pusat edukasi
      </Link>
      {(document?.links || clinicSettings.links || []).map(
        (link: { url: string; label: string }) => (
          <a className="button secondary" key={link.url} href={link.url} rel="noreferrer">
            {link.label}
          </a>
        ),
      )}
    </section>
  )
}
