import { type ContentCollection } from '@/lib/content'
import { routes } from '@/lib/content-routes'
import { checkInternalLinks } from './internal-links'
import { getSiteUrl } from '@/lib/site'
import { auditSEO } from '@/lib/seo'
import type { User } from '@/payload-types'
import type { Payload } from 'payload'

export async function getContentAudit(payload: Payload, user: User) {
  const pages = []
  for (const [collection, prefix] of Object.entries(routes)) {
    let page = 1
    do {
      const pageResult = await payload.find({
        collection: collection as ContentCollection,
        limit: 100,
        page,
        depth: 1,
        overrideAccess: false,
        user,
      })
      for (const document of pageResult.docs)
        pages.push({
          path: `/${prefix ? prefix + '/' : ''}${document.slug}`,
          status: document._status,
          seo: auditSEO(document),
          links: [
            ...(document.sections?.flatMap(
              (section) => section.links?.map((link) => link.href) || [],
            ) || []),
            ...('links' in document ? document.links?.map((link) => link.url) || [] : []),
          ],
          canonical: document.seo?.canonical,
        })
      if (!pageResult.hasNextPage) break
      page++
    } while (true)
  }
  const internalResults = await checkInternalLinks(
    pages.flatMap((page) => page.links.filter((link) => link.startsWith('/'))),
    getSiteUrl(),
  )
  const auditedPages = pages.map(({ links, ...page }) => ({
    ...page,
    brokenInternalLinks: [
      ...new Set(links.filter((link) => internalResults.get(link) === 'broken')),
    ],
    unverifiedInternalLinks: [
      ...new Set(links.filter((link) => internalResults.get(link) === 'unverified')),
    ],
    externalLinks: links.filter((link) => link.startsWith('https://')),
  }))
  const clinicSettings = await payload.findGlobal({ slug: 'settings' })
  const externalLinks = [
    ...new Set([
      ...auditedPages.flatMap((page) => page.externalLinks),
      ...(clinicSettings.links?.map((link) => link.url) || []),
    ]),
  ].sort()
  return { pages: auditedPages, externalLinks }
}
