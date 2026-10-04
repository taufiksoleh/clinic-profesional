import { canRunSEOAudit } from '@/lib/permissions'
import { checkExternalLink } from '@/server/check-link'
import { getSiteUrl } from '@/lib/site'
import { getCMS } from '@/server/cms'
import { getContentAudit } from '@/server/content/audit'
export async function GET(request: Request) {
  const payload = await getCMS()
  const { user } = await payload.auth({ headers: request.headers })
  if (!canRunSEOAudit(user)) return new Response('Unauthorized', { status: 403 })
  const { pages, externalLinks } = await getContentAudit(payload, user!)
  const rawOffset = Number(new URL(request.url).searchParams.get('externalOffset') || 0)
  const offset = Number.isSafeInteger(rawOffset) && rawOffset >= 0 ? rawOffset : 0
  const batch = externalLinks.slice(offset, offset + 4)
  const externalResults = await Promise.all(batch.map(checkExternalLink))
  return Response.json(
    {
      site: getSiteUrl(),
      checkedAt: new Date().toISOString(),
      externalResults,
      externalTotal: externalLinks.length,
      nextExternalOffset: offset + 4 < externalLinks.length ? offset + 4 : null,
      pages,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
