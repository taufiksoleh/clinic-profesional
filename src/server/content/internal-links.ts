import { safeInternalPath } from '@/lib/seo'

export type InternalLinkStatus = 'ok' | 'broken' | 'unverified'

export async function checkInternalLink(
  input: string,
  siteUrl: string,
  request: typeof fetch = fetch,
): Promise<InternalLinkStatus> {
  const origin = new URL(siteUrl).origin
  const signal = AbortSignal.timeout(5000)
  const visited = new Set<string>()
  let target = input
  try {
    for (let redirect = 0; redirect <= 5; redirect++) {
      const url = new URL(target, origin)
      if (url.origin !== origin || url.username || url.password || !safeInternalPath(url.pathname))
        return 'unverified'
      // Only check page existence; do not forward user-provided query parameters.
      url.search = ''
      url.hash = ''
      if (visited.has(url.href)) return 'broken'
      visited.add(url.href)
      const response = await request(url, {
        method: 'HEAD',
        redirect: 'manual',
        cache: 'no-store',
        signal,
      })
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location')
        if (!location) return 'unverified'
        target = new URL(location, url).href
        continue
      }
      if (response.ok) return 'ok'
      if (response.status === 404 || response.status === 410) return 'broken'
      return 'unverified'
    }
  } catch {
    return 'unverified'
  }
  return 'unverified'
}

export async function checkInternalLinks(links: string[], siteUrl: string) {
  const results = new Map<string, InternalLinkStatus>()
  const uniqueLinks = [...new Set(links)]
  const deadline = Date.now() + 15000
  for (let offset = 0; offset < uniqueLinks.length; offset += 4) {
    await Promise.all(
      uniqueLinks.slice(offset, offset + 4).map(async (link) => {
        results.set(
          link,
          Date.now() < deadline ? await checkInternalLink(link, siteUrl) : 'unverified',
        )
      }),
    )
  }
  return results
}
