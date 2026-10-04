import { PayloadPage, getAdminMetadata, type AdminSearchParams } from '@/server/admin/payload-page'

type Props = { searchParams: AdminSearchParams }

export function generateMetadata({ searchParams }: Props) {
  return getAdminMetadata({ segments: ['forgot-password'], searchParams })
}

export default function Page({ searchParams }: Props) {
  return <PayloadPage segments={['forgot-password']} searchParams={searchParams} />
}
