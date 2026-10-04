import { LinksPage } from '@/components/pages/LinksPage'
import { getPageMetadata } from '@/server/content/metadata'

export const revalidate = 60
export const generateMetadata = () => getPageMetadata('/links')

export default function Page() {
  return <LinksPage />
}
