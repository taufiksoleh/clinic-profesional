import { isManager } from '@/lib/access'
import type { CollectionConfig } from 'payload'
export const NotFoundLogs: CollectionConfig = {
  slug: 'not-found-logs',
  labels: { singular: 'Halaman 404', plural: 'Halaman 404' },
  admin: { group: 'SEO', useAsTitle: 'path' },
  access: { read: isManager, create: () => false, update: () => false, delete: isManager },
  fields: [
    { name: 'path', type: 'text', required: true, index: true },
    { name: 'lastSeen', type: 'date' },
  ],
}
