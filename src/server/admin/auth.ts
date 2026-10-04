import { canAccessAdmin } from '@/lib/permissions'
import { getCMS } from '@/server/cms'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export async function requireAdminUser() {
  const payload = await getCMS()
  const { user } = await payload.auth({ headers: await headers() })
  if (!canAccessAdmin(user)) {
    redirect('/admin/login')
  }
  return user
}
