import { test } from 'node:test'
import assert from 'node:assert/strict'
import { publicConfigSchema } from '../../src/lib/public-config'

const config = { siteUrl: 'https://clinic.example/', demoMode: 'false' }
test('public config normalizes the origin and permits disabled analytics', () => {
  assert.deepEqual(publicConfigSchema.parse(config), {
    siteUrl: 'https://clinic.example',
    demoMode: false,
  })
  assert(
    publicConfigSchema.parse({
      ...config,
      demoMode: 'true',
      googleAnalyticsId: 'G-ABC123',
      metaPixelId: '123456',
    }).demoMode,
  )
})
test('invalid origin, demo flag and enabled analytics fail configuration validation', () => {
  for (const siteUrl of [
    'https://clinic.example/path',
    'ftp://clinic.example',
    'https://user:pass@clinic.example',
    'https://clinic.example/?preview=1',
  ]) {
    assert(!publicConfigSchema.safeParse({ ...config, siteUrl }).success)
  }
  for (const invalid of [
    { demoMode: 'yes' },
    { googleAnalyticsId: 'broken' },
    { metaPixelId: 'broken' },
  ]) {
    assert(!publicConfigSchema.safeParse({ ...config, ...invalid }).success)
  }
})
