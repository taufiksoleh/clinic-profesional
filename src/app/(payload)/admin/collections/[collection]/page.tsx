import { PayloadPage, getAdminMetadata, type AdminSearchParams } from '@/server/admin/payload-page'

type Props = {
  params: Promise<{ collection: string }>
  searchParams: AdminSearchParams
}

export async function generateMetadata({ params, searchParams }: Props) {
  const { collection } = await params
  return getAdminMetadata({ segments: ['collections', collection], searchParams })
}

export default async function Page({ params, searchParams }: Props) {
  const { collection } = await params
  return <PayloadPage segments={['collections', collection]} searchParams={searchParams} />
}
