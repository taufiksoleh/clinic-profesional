import { PayloadPage, getAdminMetadata, type AdminSearchParams } from '@/server/admin/payload-page'

type Props = {
  params: Promise<{ global: string }>
  searchParams: AdminSearchParams
}

export async function generateMetadata({ params, searchParams }: Props) {
  const { global } = await params
  return getAdminMetadata({ segments: ['globals', global], searchParams })
}

export default async function Page({ params, searchParams }: Props) {
  const { global } = await params
  return <PayloadPage segments={['globals', global]} searchParams={searchParams} />
}
