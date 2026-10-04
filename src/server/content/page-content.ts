import type { ContentCollection } from '@/lib/content'
import { getCMS } from '@/server/cms'
import { notFound, permanentRedirect } from 'next/navigation'
import { getPublishedDocument } from './queries'

export async function redirectOrNotFound(path: string): Promise<never> {
  const payload = await getCMS()
  const redirects = await payload.find({
    collection: 'redirects',
    where: { from: { equals: path } },
    limit: 1,
  })
  if (redirects.docs[0]) permanentRedirect(redirects.docs[0].to)
  notFound()
}

export async function getContentOrRedirect<C extends ContentCollection>(
  collection: C,
  slug: string,
  path: string,
) {
  const document = await getPublishedDocument(collection, slug)
  return document || redirectOrNotFound(path)
}
