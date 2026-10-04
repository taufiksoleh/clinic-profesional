import { test } from 'node:test'
import assert from 'node:assert/strict'
import { checkInternalLink } from '../../src/server/content/internal-links'

const origin = 'https://clinic.example'
test('internal audit recognizes file routes and distinguishes missing pages from outages', async () => {
  for (const [status, expected] of [
    [200, 'ok'],
    [404, 'broken'],
    [410, 'broken'],
    [500, 'unverified'],
    [403, 'unverified'],
  ] as const) {
    const request: typeof fetch = async (url, options) => {
      assert.equal(String(url), origin + '/halaman-baru')
      assert.equal(options?.method, 'HEAD')
      assert.equal(options?.redirect, 'manual')
      return new Response(null, { status })
    }
    assert.equal(
      await checkInternalLink('/halaman-baru?preview=1#bagian', origin, request),
      expected,
    )
  }
})
test('internal audit never follows an external or privileged redirect', async () => {
  for (const target of [
    'https://evil.example/',
    '//evil.example/',
    '/api/cron',
    '/admin',
    '/%61pi/cron',
  ]) {
    let requests = 0
    const request: typeof fetch = async () => {
      requests++
      return new Response(null, { status: 308, headers: { location: target } })
    }
    assert.equal(await checkInternalLink('/lama', origin, request), 'unverified')
    assert.equal(requests, 1)
  }
})
test('internal audit resolves local redirects and stops cycles and network failures', async () => {
  const redirect: typeof fetch = async (url) =>
    String(url).endsWith('/lama')
      ? new Response(null, { status: 308, headers: { location: '/baru' } })
      : new Response(null, { status: 200 })
  assert.equal(await checkInternalLink('/lama', origin, redirect), 'ok')
  const cycle: typeof fetch = async () =>
    new Response(null, { status: 308, headers: { location: '/lama' } })
  assert.equal(await checkInternalLink('/lama', origin, cycle), 'broken')
  const unavailable: typeof fetch = async () => {
    throw Error('Offline')
  }
  assert.equal(await checkInternalLink('/lama', origin, unavailable), 'unverified')
})
