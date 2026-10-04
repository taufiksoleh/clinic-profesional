import { ContentPage } from '@/components/pages/ContentPage'
import { getContentOrRedirect } from '@/server/content/page-content'
import { getPageMetadata } from '@/server/content/metadata'

export const revalidate = 60

export async function generateMetadata() {
  const document = await getContentOrRedirect('pages', 'tentang', '/tentang')
  return getPageMetadata('/tentang', document)
}

export default async function Page() {
  const document = await getContentOrRedirect('pages', 'tentang', '/tentang')
  return <ContentPage doc={document} />
}
