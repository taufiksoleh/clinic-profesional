import { isManager, isStaff } from '@/lib/access'
import type { CollectionConfig } from 'payload'
export const Media: CollectionConfig = {
  slug: 'media',
  admin: { group: 'Konten' },
  access: { read: () => true, create: isStaff, update: isStaff, delete: isManager },
  upload: {
    staticDir: process.env.MEDIA_DIR || 'media',
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    imageSizes: [
      { name: 'card', width: 640, height: 480, position: 'centre' },
      { name: 'hero', width: 1440 },
    ],
    formatOptions: { format: 'webp', options: { quality: 80 } },
  },
  fields: [{ name: 'alt', label: 'Teks alternatif', type: 'text', required: true }],
}
