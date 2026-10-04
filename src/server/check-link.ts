import { request as httpsRequest } from 'node:https'
import { Resolver } from 'node:dns/promises'
import { BlockList, isIP } from 'node:net'
const blocked = new BlockList()
for (const [address, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.88.99.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const)
  blocked.addSubnet(address, prefix, 'ipv4')
export function publicIPv4(address: string) {
  return isIP(address) === 4 && !blocked.check(address, 'ipv4')
}
export function publicLinkURL(input: string) {
  const url = new URL(input)
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    (url.port && url.port !== '443') ||
    url.hostname === 'localhost' ||
    url.hostname.endsWith('.localhost') ||
    url.hostname.endsWith('.local')
  )
    throw Error('Alamat ini tidak dapat diperiksa otomatis.')
  if (isIP(url.hostname) && !publicIPv4(url.hostname)) throw Error('Alamat privat tidak diperiksa.')
  return url
}
export type LinkResult = {
  url: string
  status: 'ok' | 'broken' | 'unverified'
  httpStatus?: number
  detail?: string
}
async function inspect(
  url: URL,
  method: 'HEAD' | 'GET',
  signal: AbortSignal,
): Promise<{ status: number; location?: string }> {
  const resolver = new Resolver({ timeout: 1500, tries: 1 })
  const addresses =
    isIP(url.hostname) === 4 ? [url.hostname] : await resolver.resolve4(url.hostname)
  if (!addresses.length || !addresses.every(publicIPv4))
    throw Error('Alamat privat atau jaringan yang tidak didukung.')
  signal.throwIfAborted()
  return new Promise((resolve, reject) => {
    // Pin the validated address to the socket, preserving TLS hostname validation.
    const outgoingRequest = httpsRequest(
      url,
      {
        method,
        agent: false,
        family: 4,
        signal,
        maxHeaderSize: 16384,
        lookup: (_host, _options, done) => done(null, addresses[0], 4),
        headers: {
          'User-Agent': 'ClinicLinkChecker/1.0',
          ...(method === 'GET' ? { Range: 'bytes=0-0' } : {}),
        },
      },
      (res) => {
        resolve({ status: res.statusCode || 0, location: res.headers.location })
        res.destroy()
      },
    )
    outgoingRequest.on('error', reject)
    outgoingRequest.end()
  })
}
export async function checkExternalLink(input: string): Promise<LinkResult> {
  try {
    let url = publicLinkURL(input)
    const signal = AbortSignal.timeout(7000)
    for (let redirects = 0; redirects < 5; redirects++) {
      let result = await inspect(url, 'HEAD', signal)
      if ([405, 501].includes(result.status)) result = await inspect(url, 'GET', signal)
      if (result.status >= 300 && result.status < 400 && result.location) {
        url = publicLinkURL(new URL(result.location, url).href)
        continue
      }
      if (result.status >= 200 && result.status < 300)
        return { url: input, status: 'ok', httpStatus: result.status }
      if ([404, 410].includes(result.status))
        return { url: input, status: 'broken', httpStatus: result.status }
      return {
        url: input,
        status: 'unverified',
        httpStatus: result.status,
        detail: 'Server membatasi akses atau sedang bermasalah.',
      }
    }
    return { url: input, status: 'unverified', detail: 'Terlalu banyak pengalihan URL.' }
  } catch {
    return {
      url: input,
      status: 'unverified',
      detail: 'Tidak dapat diperiksa: alamat dibatasi, DNS/TLS bermasalah, atau waktu habis.',
    }
  }
}
