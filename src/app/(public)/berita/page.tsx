import { CategoryPage } from '@/components/pages/CategoryPage'
import { getPageMetadata } from '@/server/content/metadata'

export const revalidate = 60
export const generateMetadata = () => getPageMetadata('/berita')

export default function Page() {
  return <CategoryPage category="berita" />
}
