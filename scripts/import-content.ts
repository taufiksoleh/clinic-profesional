import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { z } from 'zod'
import { getPayload, type RequiredDataFromCollectionSlug } from 'payload'
import config from '../src/payload.config'
import { safeInternalPath } from '../src/lib/seo'
import { routes } from '../src/lib/content-routes'
const schema = z
  .array(
    z.object({
      collection: z.enum(['pages', 'articles', 'news', 'services']),
      title: z.string().min(1),
      slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      summary: z.string().min(1),
      sections: z.array(z.object({ heading: z.string().min(1), text: z.string().min(1) })),
      seo: z.object({ title: z.string().max(65), description: z.string().max(160) }),
      oldPaths: z.array(z.string().refine(safeInternalPath)).default([]),
    }),
  )
  .max(150)
const filename = process.argv[2]
if (!filename) throw Error('Penggunaan: npm run import:content -- data.json [--apply]')
const rows = schema.parse(JSON.parse(await readFile(filename, 'utf8')))
const seen = new Set<string>()
for (const r of rows) {
  const key = r.collection + '/' + r.slug
  if (seen.has(key)) throw Error('URL duplikat dalam berkas impor: ' + key)
  seen.add(key)
}
if (!process.argv.includes('--apply')) {
  console.log(`${rows.length} halaman valid. Jalankan dengan --apply untuk menyimpan sebagai draf.`)
  process.exit(0)
}
const p = await getPayload({ config })
const users = await p.find({ collection: 'users', where: { role: { equals: 'admin' } }, limit: 1 })
if (!users.docs[0]) throw Error('Buat akun Admin lebih dahulu.')
const req = { user: { ...users.docs[0], collection: 'users' as const } }
for (const row of rows) {
  const { collection, oldPaths, ...data } = row
  const existing = await p.find({ collection, where: { slug: { equals: row.slug } }, limit: 1 })
  if (existing.docs.length) {
    console.log(`Lewati URL yang sudah ada: ${collection}/${row.slug}`)
    continue
  }
  await p.create({
    collection,
    data: {
      ...data,
      _status: 'draft',
      publishedAt: new Date().toISOString(),
    } as RequiredDataFromCollectionSlug<typeof collection>,
    req,
  })
  const to = `/${routes[collection] ? routes[collection] + '/' : ''}${row.slug}`
  for (const from of oldPaths) {
    if (from === to) continue
    const found = await p.find({
      collection: 'redirects',
      where: { from: { equals: from } },
      limit: 1,
    })
    if (!found.docs.length) await p.create({ collection: 'redirects', data: { from, to }, req })
  }
  console.log(`Draf diimpor: ${to}`)
}
await p.destroy()
process.exit(0)
