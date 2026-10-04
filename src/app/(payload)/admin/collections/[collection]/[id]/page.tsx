import { PayloadPage, getAdminMetadata, type AdminSearchParams } from '@/server/admin/payload-page'

type Props = {
  params: Promise<{ collection: string; id: string }>
  searchParams: AdminSearchParams
}

export async function generateMetadata({ params, searchParams }: Props) {
  const { collection, id } = await params
  return getAdminMetadata({ segments: ['collections', collection, id], searchParams })
}

export default async function Page({ params, searchParams }: Props) {
  const { collection, id } = await params
  return <PayloadPage segments={['collections', collection, id]} searchParams={searchParams} />
}
