import { chromium, devices, expect, type Locator } from '@playwright/test'
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { requireTestEnvironment } from '../tests/helpers/environment'

requireTestEnvironment()
const directory = process.env.CLINIC_VISUAL_DIR
if (!directory) throw Error('Visual comparison requires the isolated test runner')
const update = process.argv.includes('--update')
const output = path.join(directory, update ? 'before' : 'after')
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' })
try {
  for (const [device, options] of Object.entries({
    desktop: devices['Desktop Chrome'],
    mobile: devices['iPhone 13'],
  })) {
    const context = await browser.newContext({ ...options, baseURL: process.env.TEST_BASE_URL })
    const page = await context.newPage()
    await page.route('https://www.openstreetmap.org/**', (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: '<html><body style="margin:0;background:#edf2f5"></body></html>',
      }),
    )
    async function capture(name: string, element: Locator) {
      const filename = `${device}-${name}.png`
      await element.screenshot({ path: path.join(output, filename), animations: 'disabled' })
      if (update) return
      const before = await sharp(await readFile(path.join(directory!, 'before', filename)))
        .raw()
        .toBuffer({ resolveWithObject: true })
      const after = await sharp(await readFile(path.join(output, filename)))
        .raw()
        .toBuffer({ resolveWithObject: true })
      expect(after.info, `${filename}: dimensions`).toEqual(before.info)
      expect(after.data.equals(before.data), `${filename}: pixel comparison (see ${output})`).toBe(
        true,
      )
    }
    await page.goto('/booking')
    await page.getByRole('button', { name: 'Tanpa analitik', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Ajukan konsultasi', exact: true })).toBeEnabled()
    await capture('booking', page.locator('form'))
    await page.getByRole('button', { name: 'Buat janji', exact: true }).click()
    await expect(page.getByRole('dialog').getByLabel('Jadwal praktik')).toBeVisible()
    await capture('dialog', page.getByRole('dialog'))
    await page.keyboard.press('Escape')
    await page.goto('/lokasi')
    const map = page.getByRole('tablist', { name: 'Lokasi praktik' }).locator('../..')
    await map.scrollIntoViewIfNeeded()
    await expect(map.locator('iframe')).toBeVisible()
    await capture('map', map)
    await context.close()
  }
  console.log(
    update
      ? `Visual baseline saved: ${output}`
      : 'PASS: six desktop/mobile screenshots match pixel-for-pixel.',
  )
} finally {
  await browser.close()
}
