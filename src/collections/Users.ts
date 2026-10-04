import { getSiteUrl } from '@/lib/site'
import { role } from '@/lib/permissions'
import { adminField, isAdmin } from '@/lib/access'
import type { CollectionConfig } from 'payload'
export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    tokenExpiration: 7200,
    cookies: { sameSite: 'Lax', secure: getSiteUrl().startsWith('https://') },
  },
  admin: { useAsTitle: 'name', group: 'Pengaturan' },
  access: {
    create: isAdmin,
    read: ({ req: request }) =>
      !request.user
        ? false
        : role(request.user) === 'admin'
          ? true
          : { id: { equals: request.user.id } },
    update: ({ req: request }) =>
      !request.user
        ? false
        : role(request.user) === 'admin'
          ? true
          : { id: { equals: request.user.id } },
    delete: isAdmin,
  },
  fields: [
    { name: 'name', label: 'Nama', type: 'text', required: true },
    {
      name: 'role',
      label: 'Peran',
      type: 'select',
      required: true,
      defaultValue: 'writer',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor SEO', value: 'seo' },
        { label: 'Penulis', value: 'writer' },
        { label: 'Peninjau Medis', value: 'medical' },
      ],
      access: { create: adminField, update: adminField },
    },
  ],
}
