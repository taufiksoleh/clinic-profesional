import { requireTestEnvironment } from '../tests/helpers/environment'
import 'dotenv/config'
import assert from 'node:assert/strict'
import { chromium } from '@playwright/test'

requireTestEnvironment()
if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') throw Error('Hanya untuk lingkungan demo.')
const baseURL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' })
const context = await browser.newContext({ baseURL })
const page = await context.newPage()
const browserErrors: string[] = []
page.on('pageerror', (error) => browserErrors.push(error.message))
let pageId: number | undefined
let token: string | undefined

try {
  for (const path of [
    '/admin',
    '/admin/account',
    '/admin/collections/pages',
    '/admin/globals/settings',
  ]) {
    await page.goto(path)
    await page.waitForURL((url) => url.pathname === '/admin/login')
    assert.equal(new URL(page.url()).pathname, '/admin/login', `${path} must require login`)
  }
  await page.goto('/admin/forgot-password')
  await page.locator('#field-email').waitFor()
  await page.goto('/admin/login')
  await page.locator('#field-email').fill(process.env.SEED_ADMIN_EMAIL!)
  await page.locator('#field-password').fill(process.env.SEED_ADMIN_PASSWORD!)
  const loginResponse = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/users/login' &&
      response.request().method() === 'POST',
  )
  await page.locator('button[type="submit"]').click()
  const login = await loginResponse
  assert.equal(login.status(), 200)
  token = (await login.json()).token
  await page.waitForURL((url) => url.pathname === '/admin')
  await page.getByRole('heading', { name: 'Klinik · Ringkasan operasional' }).waitFor()

  await page.goto('/admin/account')
  await page.locator('#field-email').waitFor()
  await page.goto('/admin/collections/pages?limit=10')
  assert.equal(new URL(page.url()).searchParams.get('limit'), '10')
  await page.goto('/admin/collections/pages/create')
  await page.locator('#field-title').fill('Uji routing admin')
  await page.locator('#field-slug').fill(`admin-routing-${crypto.randomUUID().slice(0, 8)}`)
  await page.locator('#field-summary').fill('Konten sementara untuk pengujian route admin.')
  const createResponse = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/pages' && response.request().method() === 'POST',
  )
  await page.locator('#action-save-draft').click()
  const created = await createResponse
  assert.equal(created.status(), 201, await created.text())
  pageId = (await created.json()).doc.id
  await page.waitForURL((url) => url.pathname === `/admin/collections/pages/${pageId}`)
  await page.locator('#field-title').fill('Uji routing admin diperbarui')
  const updateResponse = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === `/api/pages/${pageId}` &&
      response.request().method() === 'PATCH',
  )
  await page.locator('#action-save-draft').click()
  assert.equal((await updateResponse).status(), 200)

  const versions = await page.goto(`/admin/collections/pages/${pageId}/versions`)
  assert.equal(versions?.status(), 200)
  await page.goto('/admin/globals/settings')
  await page.locator('#field-name').waitFor()
  const missing = await page.goto('/admin/halaman-tidak-ada-untuk-uji')
  assert.equal(missing?.status(), 404)
  assert.deepEqual(browserErrors, [])
  await page.goto('/admin/logout')
  await page.waitForURL((url) => url.pathname === '/admin/login')
  console.log(
    'PASS: admin login guard, login, dashboard, account, list, create/edit draft, versions fallback, settings, 404, logout; no browser errors.',
  )
} finally {
  try {
    if (pageId && token) {
      // Logout revokes the session; obtain a fresh token only for test cleanup.
      const login = await context.request.post('/api/users/login', {
        headers: { Origin: baseURL },
        data: { email: process.env.SEED_ADMIN_EMAIL, password: process.env.SEED_ADMIN_PASSWORD },
      })
      const { token: cleanupToken } = await login.json()
      const deleted = await context.request.delete(`/api/pages/${pageId}`, {
        headers: { Authorization: `JWT ${cleanupToken}`, Origin: baseURL },
      })
      assert.equal(deleted.status(), 200)
    }
  } finally {
    await browser.close()
  }
}
