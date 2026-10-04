import { test } from 'node:test'
import assert from 'node:assert/strict'
import { publicIPv4, publicLinkURL, checkExternalLink } from '../../src/server/check-link'
test('external audits reject private and special network destinations', () => {
  for (const ip of [
    '0.0.0.0',
    '10.1.1.1',
    '127.0.0.1',
    '169.254.169.254',
    '172.16.0.1',
    '192.168.0.1',
    '100.64.0.1',
    '198.18.0.1',
    '203.0.113.5',
    '224.0.0.1',
    '255.255.255.255',
    '::1',
  ])
    assert(!publicIPv4(ip), ip)
  assert(publicIPv4('8.8.8.8'))
  for (const url of [
    'http://example.com',
    'https://127.0.0.1',
    'https://localhost',
    'https://example.com:8080',
    'https://user:pass@example.com',
    'https://2130706433',
  ])
    assert.throws(() => publicLinkURL(url))
  assert.equal(publicLinkURL('https://example.com/article').hostname, 'example.com')
})
test('blocked addresses are unverified without probing local services', async () => {
  const result = await checkExternalLink('https://127.0.0.1')
  assert.equal(result.status, 'unverified')
  assert.equal(result.httpStatus, undefined)
})
