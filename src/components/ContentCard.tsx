import type { Content } from '@/lib/content'
import Link from 'next/link'
export function ContentCard({
  doc: document,
  category,
  heading: Heading = 'h3',
}: {
  doc: Content & { specialty?: string; city?: string }
  category: string
  heading?: 'h2' | 'h3'
}) {
  return (
    <Link className={`card card-${category}`} href={`/${category}/${document.slug}`}>
      {document.image?.url ? (
        <img
          src={document.image.sizes?.card?.url || document.image.url}
          alt={document.image.alt}
          width={640}
          height={480}
          loading="lazy"
        />
      ) : category === 'dokter' ? (
        <div className="doctor-initials" aria-hidden="true">
          {document.title
            .replace(/^dr\.\s*/, '')
            .split(' ')
            .slice(0, 2)
            .map((n) => n[0])
            .join('')}
        </div>
      ) : null}
      <div className="card-body">
        <span className="eyebrow">
          {document.specialty ||
            document.city ||
            (category === 'blog'
              ? 'Edukasi kesehatan'
              : category === 'layanan'
                ? 'Layanan klinik'
                : 'Informasi klinik')}
        </span>
        <Heading>{document.title}</Heading>
        <p>{document.summary}</p>
        <span className="card-link">
          {category === 'dokter'
            ? 'Profil & jadwal'
            : category === 'lokasi'
              ? 'Lihat lokasi'
              : 'Baca selengkapnya'}
        </span>
      </div>
    </Link>
  )
}
