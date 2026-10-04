import { rateLimit } from '@/server/db'
import { getSiteUrl } from '@/lib/site'
import { getCMS } from '@/server/cms'
export async function POST(request: Request) {
  if (request.headers.get('origin') !== getSiteUrl()) return new Response(null, { status: 403 })
  try {
    const text = await request.text()
    if (text.length > 600) return new Response(null, { status: 413 })
    const { path } = JSON.parse(text)
    if (typeof path !== 'string' || !/^\/[a-z0-9/_-]{0,250}$/i.test(path))
      return new Response(null, { status: 400 })
    if (!(await rateLimit('404-log', 100, 60))) return new Response(null, { status: 429 })
    const payload = await getCMS()
    const r = await payload.find({
      collection: 'not-found-logs',
      where: { path: { equals: path } },
      limit: 1,
    })
    if (r.docs[0])
      await payload.update({
        collection: 'not-found-logs',
        id: r.docs[0].id,
        data: { lastSeen: new Date().toISOString() },
      })
    else
      await payload.create({
        collection: 'not-found-logs',
        data: { path, lastSeen: new Date().toISOString() },
      })
    return new Response(null, { status: 204 })
  } catch {
    return new Response(null, { status: 400 })
  }
}
