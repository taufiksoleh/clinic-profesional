import { ContentPage } from '@/components/pages/ContentPage'
import { getPublishedContent } from '@/server/content/queries'
import { getContentOrRedirect } from '@/server/content/page-content'
import { getPageMetadata } from '@/server/content/metadata'

export const revalidate = 60

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  return (await getPublishedContent('news')).map((document) => ({ slug: document.slug }))
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const path = `/berita/${slug}`
  const document = await getContentOrRedirect('news', slug, path)
  return getPageMetadata(path, document)
}

export default async function Page({ params }: Props) {
  const { slug } = await params
  const document = await getContentOrRedirect('news', slug, `/berita/${slug}`)
  return <ContentPage doc={document} category="berita" />
}
