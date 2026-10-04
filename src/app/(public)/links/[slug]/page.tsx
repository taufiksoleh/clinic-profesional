import { LinksPage } from '@/components/pages/LinksPage'
import { getPageMetadata } from '@/server/content/metadata'

export const revalidate = 60

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  return getPageMetadata(`/links/${slug}`)
}

export default async function Page({ params }: Props) {
  const { slug } = await params
  return <LinksPage slug={slug} />
}
