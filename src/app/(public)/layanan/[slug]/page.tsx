import { ServicePage } from '@/components/pages/ServicePage'
import { getPublishedContent } from '@/server/content/queries'
import { getContentOrRedirect } from '@/server/content/page-content'
import { getPageMetadata } from '@/server/content/metadata'

export const revalidate = 60

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return (await getPublishedContent('services')).map((document) => ({ slug: document.slug }))
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const path = `/layanan/${slug}`
  const document = await getContentOrRedirect('services', slug, path)
  return getPageMetadata(path, document)
}

export default async function Page({ params }: Props) {
  const { slug } = await params
  const document = await getContentOrRedirect('services', slug, `/layanan/${slug}`)
  return <ServicePage service={document} />
}
