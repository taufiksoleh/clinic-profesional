import { requireAdminUser } from '@/server/admin/auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminUser()
  return children
}
