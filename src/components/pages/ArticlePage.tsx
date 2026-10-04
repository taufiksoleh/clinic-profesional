import type { ArticleDetail } from '@/lib/content'
import { getArticleSchema } from '@/lib/structured-data'
import { getPublishedArticles } from '@/server/content/queries'
import { ContentPage } from './ContentPage'
import { MedicalReview } from './MedicalReview'
import { RelatedCards } from './RelatedCards'

export async function ArticlePage({ article }: { article: ArticleDetail }) {
  const relatedArticles = await getPublishedArticles({
    serviceIds: article.services.map((service) => service.id),
    excludeId: article.id,
    limit: 3,
  })
  return (
    <ContentPage
      doc={article}
      category="blog"
      eyebrow="Pusat edukasi"
      schema={getArticleSchema(article)}
      headerExtra={<MedicalReview {...article} />}
      afterContent={<RelatedCards title="Baca juga" documents={relatedArticles} category="blog" />}
    />
  )
}
