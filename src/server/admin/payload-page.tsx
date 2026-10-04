import config from '@payload-config'
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import { importMap } from '@/app/(payload)/admin/importMap'

export type AdminSearchParams = Promise<Record<string, string | string[]>>

type Props = {
  segments: string[]
  searchParams: AdminSearchParams
}

export function getAdminMetadata({ segments, searchParams }: Props) {
  return generatePageMetadata({ config, params: Promise.resolve({ segments }), searchParams })
}

export function PayloadPage({ segments, searchParams }: Props) {
  return RootPage({ config, importMap, params: Promise.resolve({ segments }), searchParams })
}
