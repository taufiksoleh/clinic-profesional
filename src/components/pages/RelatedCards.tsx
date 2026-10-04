import type { Content } from '@/lib/content'
import { ContentCard } from '@/components/ContentCard'

export function RelatedCards({
  title,
  documents,
  category,
  emptyMessage,
}: {
  title: string
  documents: Content[]
  category: string
  emptyMessage?: string
}) {
  if (!documents.length && !emptyMessage) return null
  return (
    <div className="section">
      <h2>{title}</h2>
      <div className="cards">
        {documents.map((document) => (
          <ContentCard key={document.id} doc={document} category={category} />
        ))}
      </div>
      {!documents.length && <p>{emptyMessage}</p>}
    </div>
  )
}
