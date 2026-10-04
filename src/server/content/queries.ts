import {
  hasPublishedRelationships,
  toPublicContent,
  toPublicSchedule,
  toPublicArticle,
  type ArticleDetail,
  type PublicContentByCollection,
  type ContentCollection,
  type PublicSchedule,
} from '@/lib/content'
import { getCMS } from '@/server/cms'
import { unstable_cache } from 'next/cache'
import type { Where } from 'payload'
export const getPublishedContent = unstable_cache(
  async <C extends ContentCollection>(collection: C): Promise<PublicContentByCollection[C][]> => {
    const payload = await getCMS()
    const documents: PublicContentByCollection[C][] = []
    let page = 1
    do {
      const pageResult = await payload.find({
        collection,
        overrideAccess: false,
        where: { _status: { equals: 'published' } },
        depth: 2,
        limit: 100,
        page,
      })
      documents.push(...pageResult.docs.map((document) => toPublicContent(collection, document)))
      if (!pageResult.hasNextPage) break
      page++
    } while (true)
    return documents
  },
  ['published-content'],
  { revalidate: 60, tags: ['content'] },
)
export const getPublishedDocument = unstable_cache(
  async <C extends ContentCollection>(
    collection: C,
    slug: string,
  ): Promise<PublicContentByCollection[C] | undefined> => {
    const payload = await getCMS()
    const documents = await payload.find({
      collection,
      overrideAccess: false,
      where: { and: [{ _status: { equals: 'published' } }, { slug: { equals: slug } }] },
      depth: 2,
      limit: 1,
    })
    return documents.docs[0] ? toPublicContent(collection, documents.docs[0]) : undefined
  },
  ['published-document'],
  { revalidate: 60, tags: ['content'] },
)

type ArticleFilter = {
  reviewerId?: number
  serviceIds?: number[]
  excludeId?: number
  limit?: number
}

export const getPublishedArticles = unstable_cache(
  async (filter: ArticleFilter): Promise<ArticleDetail[]> => {
    if (filter.serviceIds?.length === 0) return []
    const payload = await getCMS()
    const conditions: Where[] = [{ _status: { equals: 'published' } }]
    if (filter.reviewerId !== undefined)
      conditions.push({ reviewer: { equals: filter.reviewerId } })
    if (filter.serviceIds) conditions.push({ services: { in: filter.serviceIds } })
    if (filter.excludeId !== undefined) conditions.push({ id: { not_equals: filter.excludeId } })
    const articles: ArticleDetail[] = []
    let page = 1
    do {
      const documents = await payload.find({
        collection: 'articles',
        overrideAccess: false,
        where: { and: conditions },
        depth: 2,
        limit: filter.limit ?? 100,
        page,
      })
      articles.push(...documents.docs.map(toPublicArticle))
      if (filter.limit || !documents.hasNextPage) break
      page++
    } while (true)
    return articles
  },
  ['published-articles'],
  { revalidate: 60, tags: ['content'] },
)

type ScheduleFilter = { doctor?: number; location?: number; service?: number }

export const getPublicSchedules = unstable_cache(
  async (filter: ScheduleFilter = {}): Promise<PublicSchedule[]> => {
    const payload = await getCMS()
    const documents: PublicSchedule[] = []
    let page = 1
    do {
      const pageResult = await payload.find({
        collection: 'schedules',
        overrideAccess: false,
        where: {
          and: [
            { active: { equals: true } },
            ...Object.entries(filter).map(([relationship, id]) => ({
              [relationship]: { equals: id },
            })),
          ],
        },
        limit: 100,
        page,
        depth: 2,
      })
      documents.push(...pageResult.docs.filter(hasPublishedRelationships).map(toPublicSchedule))
      if (!pageResult.hasNextPage) break
      page++
    } while (true)
    return documents
  },
  ['schedules'],
  { revalidate: 60, tags: ['content', 'schedules'] },
)
export const getClinicSettings = unstable_cache(
  async () => (await getCMS()).findGlobal({ slug: 'settings', overrideAccess: false }),
  ['settings'],
  { revalidate: 60, tags: ['settings'] },
)
