import { getPublicConfig } from '@/lib/public-config'
import { categories } from '@/lib/constants'
import { getRelatedDocument } from '@/lib/content'
import { getSiteUrl } from '@/lib/site'
import { getClinicSettings } from '@/server/content/queries'
import type { Metadata } from 'next'
import type { Content } from '@/lib/content'
export async function getPageMetadata(pathname: string, document?: Content): Promise<Metadata> {
  const path = pathname.split('/').filter(Boolean)
  const category = categories[path[0]]
  const clinicSettings = await getClinicSettings()
  const routeSEO = clinicSettings.pageSEO?.find(
    (entry: { path: string }) => entry.path === `/${path.join('/')}`,
  )
  const effectiveSEO = document?.seo || routeSEO
  const title =
    effectiveSEO?.title ||
    document?.title ||
    category?.title ||
    { booking: 'Buat janji konsultasi', links: 'Tautan resmi', kontak: 'Hubungi kami' }[path[0]] ||
    clinicSettings.name
  const description =
    effectiveSEO?.description ||
    document?.summary ||
    category?.description ||
    clinicSettings.description ||
    undefined
  const image = getRelatedDocument(effectiveSEO?.image)
  return {
    title,
    description,
    alternates: { canonical: effectiveSEO?.canonical || `${getSiteUrl()}/${path.join('/')}` },
    robots: {
      index: !getPublicConfig().demoMode && !effectiveSEO?.noindex,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: `${getSiteUrl()}/${path.join('/')}`,
      type: path[0] === 'blog' ? 'article' : 'website',
      images: image?.url ? [new URL(image.url, getSiteUrl()).href] : [],
    },
    twitter: {
      card: image?.url ? 'summary_large_image' : 'summary',
      title,
      description,
      images: image?.url ? [new URL(image.url, getSiteUrl()).href] : [],
    },
  }
}
