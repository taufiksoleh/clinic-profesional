import { canManageBookings } from '@/lib/permissions'
import type { ContentDocument } from '@/lib/content'
import { type ContentCollection } from '@/lib/content'
import { auditSEO } from '@/lib/seo'
import { getSiteUrl } from '@/lib/site'
import { getCMS } from '@/server/cms'
import { headers } from 'next/headers'
import Link from 'next/link'
import { LinkAudit } from './LinkAudit'
export async function AdminOverview() {
  const payload = await getCMS()
  const { user } = await payload.auth({ headers: await headers() })
  if (!user) return null
  const showBookingManagement = canManageBookings(user)
  const documents: (ContentDocument & { collection: string; reviewState?: string | null })[] = []
  for (const collection of ['doctors', 'locations', 'services', 'articles', 'news', 'pages']) {
    const pageResult = await payload.find({
      collection: collection as ContentCollection,
      limit: 100,
      overrideAccess: false,
      user,
      depth: 1,
    })
    for (const document of pageResult.docs) documents.push({ ...document, collection: collection })
  }
  const bookings = showBookingManagement
    ? await payload.count({
        collection: 'bookings',
        where: { status: { equals: 'new' } },
        overrideAccess: false,
        user,
      })
    : null
  return (
    <section
      style={{
        marginBottom: 40,
        padding: 24,
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: 10,
      }}
    >
      <h2>Klinik · Ringkasan operasional</h2>
      <p>
        Selamat datang, {String(user.name)}.{' '}
        {bookings
          ? `${bookings.totalDocs} booking baru menunggu tindak lanjut.`
          : 'Kelola konten dan proses tinjauan medis.'}
      </p>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', margin: '20px 0' }}>
        <Link href="/" target="_blank">
          Lihat website
        </Link>
        {showBookingManagement && (
          <>
            <Link href="/admin/collections/bookings">Booking masuk</Link>
            <a href="/api/export">Ekspor booking ke Excel (CSV)</a>
            <Link href="/admin/collections/redirects">Redirect URL</Link>
            <Link href="/admin/collections/not-found-logs">Laporan 404</Link>
            <a href="/api/seo-audit">Unduh audit SEO & tautan</a>
          </>
        )}
      </div>
      {showBookingManagement && <LinkAudit />}
      <h3>Kelengkapan SEO & pratinjau pencarian</h3>
      <p>
        Skor mengukur kelengkapan konten, bukan jaminan peringkat Google. Daftar menampilkan
        maksimal 100 dokumen per jenis.
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))',
          gap: 16,
        }}
      >
        {documents.map((document) => {
          const audit = auditSEO(document)
          return (
            <article
              key={`${document.collection}-${document.id}`}
              style={{
                padding: 18,
                border: '1px solid var(--theme-elevation-150)',
                borderRadius: 8,
              }}
            >
              <Link href={`/admin/collections/${document.collection}/${document.id}`}>
                <strong>{String(document.title)}</strong>
              </Link>
              <p>
                {audit.score}/100 · {String(document._status)}
                {document.reviewState ? ` · Medis: ${document.reviewState}` : ''}
              </p>
              <div
                style={{ background: 'var(--theme-elevation-50)', padding: 12, borderRadius: 6 }}
              >
                <small>{getSiteUrl()}</small>
                <h4 style={{ color: '#4176df', margin: '6px 0' }}>
                  {String(document.seo?.title || document.title)}
                </h4>
                <p style={{ margin: 0, fontSize: 14 }}>
                  {String(document.seo?.description || 'Deskripsi belum diisi.')}
                </p>
              </div>
              <details style={{ marginTop: 12 }}>
                <summary>Pemeriksaan & WhatsApp</summary>
                <ul>
                  {audit.checks.map((collection) => (
                    <li key={collection.name}>
                      {collection.ok ? '✓' : '○'} {collection.name}
                    </li>
                  ))}
                </ul>
                <div style={{ borderLeft: '4px solid #25a365', padding: 12 }}>
                  <strong>{String(document.seo?.title || document.title)}</strong>
                  <p>{String(document.seo?.description || 'Belum ada deskripsi.')}</p>
                  <small>
                    {document.seo?.image
                      ? 'Gambar Open Graph tersedia'
                      : 'Gambar Open Graph belum diatur'}
                  </small>
                </div>
              </details>
            </article>
          )
        })}
      </div>
    </section>
  )
}
