import { PayloadPage, getAdminMetadata, type AdminSearchParams } from '@/server/admin/payload-page'

type Props = { searchParams: AdminSearchParams }

export function generateMetadata({ searchParams }: Props) {
  return getAdminMetadata({ segments: [], searchParams })
}

export default function Page({ searchParams }: Props) {
  return <PayloadPage segments={[]} searchParams={searchParams} />
}
