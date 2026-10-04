import { ContentCard } from '@/components/ContentCard'
import { DoctorFinder } from '@/components/DoctorFinder'
import { NetworkMap } from '@/components/NetworkMap'
import { categories } from '@/lib/constants'
import { getPublicSchedules, getPublishedContent } from '@/server/content/queries'
import { Breadcrumb } from './Breadcrumb'
export async function CategoryPage({ category }: { category: string }) {
  const categoryConfig = categories[category]
  const doctors = category === 'dokter' ? await getPublishedContent('doctors') : undefined
  const locations = category === 'lokasi' ? await getPublishedContent('locations') : undefined
  const documents = doctors ?? locations ?? (await getPublishedContent(categoryConfig.collection))
  return (
    <section className="container section">
      <Breadcrumb items={[{ label: categoryConfig.title, href: `/${category}` }]} />
      <div className="page-intro">
        <span className="eyebrow">Klinik & Anda</span>
        <h1>{categoryConfig.title}</h1>
        <p>{categoryConfig.description}</p>
      </div>
      {doctors ? (
        <DoctorFinder doctors={doctors} schedules={await getPublicSchedules()} />
      ) : (
        <>
          <div className="cards">
            {documents.map((document) => (
              <ContentCard key={document.id} doc={document} category={category} heading="h2" />
            ))}
          </div>
          {!documents.length && <p className="empty">Konten sedang disiapkan oleh tim klinik.</p>}
          {locations && (
            <div className="section">
              <NetworkMap locations={locations} schedules={await getPublicSchedules()} />
            </div>
          )}
        </>
      )}
    </section>
  )
}
