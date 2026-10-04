import { ContentPage } from '@/components/pages/ContentPage'
import { getPageMetadata } from '@/server/content/metadata'
import { getContentOrRedirect, redirectOrNotFound } from '@/server/content/page-content'

export const revalidate = 60

type Props = { params: Promise<{ path: string[] }> }

async function getCMSPage(path: string[]) {
  const pathname = `/${path.join('/')}`
  if (path.length !== 1) return redirectOrNotFound(pathname)
  return getContentOrRedirect('pages', path[0], pathname)
}

export async function generateMetadata({ params }: Props) {
  const { path } = await params
  const document = await getCMSPage(path)
  return getPageMetadata(`/${path.join('/')}`, document)
}

export default async function Page({ params }: Props) {
  const { path } = await params
  const document = await getCMSPage(path)
  return <ContentPage doc={document} />
}
