import { requireTestEnvironment } from '../helpers/environment'
import 'dotenv/config'
import { test, expect } from '@playwright/test'
requireTestEnvironment()
test('public routes render, have one H1 and no horizontal overflow', async ({ page }) => {
  for (const path of [
    '/',
    '/dokter',
    '/layanan',
    '/lokasi',
    '/blog',
    '/berita',
    '/tentang',
    '/kontak',
    '/links',
    '/kebijakan-privasi',
    '/booking',
  ]) {
    const r = await page.goto(path)
    expect(r?.status()).toBe(200)
    await expect(page.locator('h1')).toHaveCount(1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})
test('doctor filters and booking modal are usable', async ({ page }) => {
  await page.goto('/dokter')
  await page.getByRole('button', { name: 'Tanpa analitik', exact: true }).click()
  const doctors = await (await page.request.get('/api/doctors?limit=1')).json()
  await page.getByLabel('Nama dokter').fill(doctors.docs[0].title)
  await expect(page.locator('.cards .card')).toHaveCount(1)
  await page.getByLabel('Nama dokter').fill('Nobody')
  await expect(page.getByText('Belum ada dokter yang cocok. Coba ubah filter.')).toBeVisible()
  await page.getByRole('button', { name: 'Buat janji', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('dialog').getByLabel('Jadwal praktik')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
})
test('patient submits a booking and sees durable reference', async ({ page, request }) => {
  const slots = await (await request.get('/api/booking-options')).json()
  const s = slots[0]
  const d = new Date()
  d.setDate(d.getDate() + 1)
  while (d.getDay() !== s.day) d.setDate(d.getDate() + 1)
  await page.goto('/booking')
  await page.getByRole('button', { name: 'Tanpa analitik', exact: true }).click()
  await page.getByLabel('Jadwal praktik').selectOption(String(s.id))
  await expect(page.getByText('Biaya konsultasi', { exact: true })).toBeVisible()
  await page
    .getByLabel('Tanggal yang diinginkan')
    .fill(d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }))
  await page.getByLabel('Nama lengkap').fill('Browser test patient')
  await page.getByLabel('Nomor WhatsApp').fill(
    `0813${Math.floor(Math.random() * 1e8)
      .toString()
      .padStart(8, '0')}`,
  )
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Ajukan konsultasi', exact: true }).click()
  await expect(page.getByText('Permintaan tersimpan')).toBeVisible()
  const reference = await page.getByRole('status').locator('strong').innerText()
  expect(reference).toMatch(/^KG-/)
  const login = await request.post('/api/users/login', {
    data: { email: process.env.SEED_ADMIN_EMAIL, password: process.env.SEED_ADMIN_PASSWORD },
  })
  expect(login.status()).toBe(200)
  const { token } = await login.json()
  const result = await request.get(`/api/bookings?where[reference][equals]=${reference}`, {
    headers: { Authorization: `JWT ${token}` },
  })
  const docs = (await result.json()).docs
  expect(docs).toHaveLength(1)
  await request.delete(`/api/bookings/${docs[0].id}`, {
    headers: { Authorization: `JWT ${token}` },
  })
})
test('404 offers recovery', async ({ page }) => {
  await page.goto('/halaman-tidak-ada')
  await expect(page.getByRole('link', { name: 'Kembali ke beranda' })).toBeVisible()
})
