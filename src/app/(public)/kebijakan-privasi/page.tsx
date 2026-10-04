import { ContentPage } from '@/components/pages/ContentPage'
import { getContentOrRedirect } from '@/server/content/page-content'
import { getPageMetadata } from '@/server/content/metadata'

export const revalidate = 60

export async function generateMetadata() {
  const document = await getContentOrRedirect('pages', 'kebijakan-privasi', '/kebijakan-privasi')
  return getPageMetadata('/kebijakan-privasi', document)
}

export default async function Page() {
  const document = await getContentOrRedirect('pages', 'kebijakan-privasi', '/kebijakan-privasi')
  return <ContentPage doc={document} />
}
