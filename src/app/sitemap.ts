import { getPublicConfig } from '@/lib/public-config'
import { categories } from '@/lib/constants'
import { getSiteUrl } from '@/lib/site'
import { getPublishedContent } from '@/server/content/queries'
import type { MetadataRoute } from 'next'
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (getPublicConfig().demoMode) return []
  const result: MetadataRoute.Sitemap = [
    '',
    'dokter',
    'lokasi',
    'layanan',
    'blog',
    'berita',
    'booking',
    'kontak',
    'links',
  ].map((payload) => ({ url: `${getSiteUrl()}/${payload}` }))
  for (const [key, c] of Object.entries(categories))
    for (const document of await getPublishedContent(c.collection))
      if (!document.seo?.noindex)
        result.push({
          url: `${getSiteUrl()}/${key}/${document.slug}`,
          lastModified: document.updatedAt,
        })
  for (const document of await getPublishedContent('pages'))
    if (!document.seo?.noindex)
      result.push({ url: `${getSiteUrl()}/${document.slug}`, lastModified: document.updatedAt })
  return result
}
