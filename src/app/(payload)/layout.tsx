import { canPublishContent } from '@/lib/permissions'
import { getCMS } from '@/server/cms'
import config from '@payload-config'
import '@payloadcms/next/css'
import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts'
import { headers } from 'next/headers'
import type { ServerFunctionClient } from 'payload'
import { importMap } from './admin/importMap'
const serverFunction: ServerFunctionClient = async (args) => {
  'use server'
  if (args.name === 'schedule-publish') {
    const { user } = await (await getCMS()).auth({ headers: await headers() })
    if (!canPublishContent(user))
      throw new Error('Hanya Admin atau Editor SEO yang dapat menjadwalkan publikasi.')
  }
  return handleServerFunctions({ ...args, config, importMap })
}
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
      {children}
    </RootLayout>
  )
}
