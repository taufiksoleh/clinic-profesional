import { isManager } from '@/lib/access'
import { safeInternalPath } from '@/lib/seo'
import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'
export const Redirects: CollectionConfig = {
  slug: 'redirects',
  labels: { singular: 'Redirect', plural: 'Redirect URL' },
  admin: { group: 'SEO', useAsTitle: 'from' },
  access: { read: isManager, create: isManager, update: isManager, delete: isManager },
  fields: [
    {
      name: 'from',
      type: 'text',
      required: true,
      unique: true,
      validate: (v: unknown) =>
        safeInternalPath(String(v)) || 'Gunakan path internal seperti /artikel-lama',
    },
    {
      name: 'to',
      type: 'text',
      required: true,
      validate: (v: unknown) =>
        safeInternalPath(String(v)) || 'Gunakan path internal seperti /blog/artikel-baru',
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, originalDoc, req: request }) => {
        const from = data.from ?? originalDoc?.from
        const to = data.to ?? originalDoc?.to
        const seen = new Set([from])
        let path = to
        for (let i = 0; i < 20; i++) {
          if (seen.has(path)) throw new APIError('Redirect membentuk loop.', 400)
          seen.add(path)
          const next = await request.payload.find({
            collection: 'redirects',
            where: { from: { equals: path } },
            limit: 1,
            req: request,
          })
          if (!next.docs[0]) return data
          path = String(next.docs[0].to)
        }
        throw new APIError('Rantai redirect terlalu panjang.', 400)
      },
    ],
  },
}
