import { requireTestEnvironment } from '../helpers/environment'
import 'dotenv/config'
import { test } from 'node:test'
import assert from 'node:assert/strict'
requireTestEnvironment()
const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const call = (path: string, options: RequestInit = {}) =>
  fetch(base + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', Origin: base, ...options.headers },
  })
async function login(email: string, password: string) {
  const r = await call('/api/users/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  assert.equal(r.status, 200)
  return (await r.json()).token as string
}
const admin = () => login(process.env.SEED_ADMIN_EMAIL!, process.env.SEED_ADMIN_PASSWORD!)
test('anonymous visitors cannot read booking data, export or user accounts', async () => {
  for (const path of ['/api/bookings', '/api/export', '/api/users', '/api/seo-audit']) {
    const r = await call(path)
    assert([401, 403].includes(r.status), `${path}: ${r.status}`)
  }
})
test('booking persists, derives price server-side, and retries only once', async () => {
  const r = await call('/api/schedules?depth=2&limit=1')
  const s = (await r.json()).docs[0]
  const d = new Date()
  d.setDate(d.getDate() + 1)
  while (d.getDay() !== s.day) d.setDate(d.getDate() + 1)
  const date = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
  const body = {
    requestId: crypto.randomUUID(),
    name: 'Integration test patient',
    phone: `0812${Math.floor(Math.random() * 1e8)
      .toString()
      .padStart(8, '0')}`,
    scheduleId: s.id,
    date,
    consent: true,
    fee: 1,
  }
  const results = await Promise.all([
    call('/api/booking', { method: 'POST', body: JSON.stringify(body) }),
    call('/api/booking', { method: 'POST', body: JSON.stringify(body) }),
  ])
  const responses = await Promise.all(
    results.map(async (r) => {
      assert.equal(r.status, 200, await r.clone().text())
      return r.json()
    }),
  )
  assert.equal(responses[0].reference, responses[1].reference)
  const token = await admin()
  const saved = await call(`/api/bookings?where[requestId][equals]=${body.requestId}`, {
    headers: { Authorization: `JWT ${token}` },
  })
  const docs = (await saved.json()).docs
  assert.equal(docs.length, 1)
  assert.equal(docs[0].fee, s.fee)
  await call(`/api/bookings/${docs[0].id}`, {
    method: 'DELETE',
    headers: { Authorization: `JWT ${token}` },
  })
})
test('invalid origins and missing consent cannot create bookings', async () => {
  const r = await call('/api/booking', {
    method: 'POST',
    body: '{}',
    headers: { Origin: 'https://evil.example' },
  })
  assert.equal(r.status, 403)
  const r2 = await call('/api/booking', { method: 'POST', body: '{}' })
  assert.equal(r2.status, 400)
})
test('cron is protected by a secret', async () => {
  const r = await call('/api/cron')
  assert.equal(r.status, 401)
})
test('writer cannot publish, approve medical content, access patients, or elevate role', async () => {
  const token = await admin()
  const suffix = crypto.randomUUID().slice(0, 8)
  const email = `writer-${suffix}@example.test`
  const password = crypto.randomUUID()
  const res = await call('/api/users', {
    method: 'POST',
    headers: { Authorization: `JWT ${token}` },
    body: JSON.stringify({ email, password, name: 'Test Writer', role: 'writer' }),
  })
  assert.equal(res.status, 201, await res.clone().text())
  const user = (await res.json()).doc
  let articleId: number | undefined
  try {
    const writer = await login(email, password)
    const headers = { Authorization: `JWT ${writer}` }
    const article = {
      title: 'Test draft',
      slug: `test-${suffix}`,
      summary: 'Test',
      sections: [{ heading: 'Test', text: 'Test' }],
      seo: {
        title: 'Test title complete enough for search',
        description:
          'A test description for workflow checks with content that must not be publicly published.',
      },
      _status: 'published',
      reviewState: 'approved',
    }
    const fail = await call('/api/articles', {
      method: 'POST',
      headers,
      body: JSON.stringify(article),
    })
    assert(fail.status >= 400)
    const draft = await call('/api/articles', {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...article, _status: 'draft', reviewState: 'pending' }),
    })
    assert.equal(draft.status, 201, await draft.clone().text())
    articleId = (await draft.json()).doc.id
    const anonymous = await call(`/api/articles/${articleId}`)
    assert([403, 404].includes(anonymous.status))
    const update = await call(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ role: 'admin' }),
    })
    assert([200, 403].includes(update.status))
    const me = await call('/api/users/me', { headers })
    assert.equal((await me.json()).user.role, 'writer')
    assert.equal((await call('/api/bookings', { headers })).status, 403)
    const queue = await call('/api/payload-jobs', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        taskSlug: 'schedulePublish',
        input: { doc: { relationTo: 'articles', value: articleId } },
      }),
    })
    assert.equal(queue.status, 403)
  } finally {
    if (articleId)
      await call(`/api/articles/${articleId}`, {
        method: 'DELETE',
        headers: { Authorization: `JWT ${token}` },
      })
    await call(`/api/users/${user.id}`, {
      method: 'DELETE',
      headers: { Authorization: `JWT ${token}` },
    })
  }
})

test('partial redirect updates cannot introduce a cycle', async () => {
  const token = await admin()
  const headers = { Authorization: `JWT ${token}` }
  const prefix = '/test-' + crypto.randomUUID().slice(0, 8)
  const a = await call('/api/redirects', {
    method: 'POST',
    headers,
    body: JSON.stringify({ from: prefix + '-a', to: prefix + '-b' }),
  })
  assert.equal(a.status, 201)
  const first = (await a.json()).doc
  let second: number | undefined
  try {
    const b = await call('/api/redirects', {
      method: 'POST',
      headers,
      body: JSON.stringify({ from: prefix + '-b', to: prefix + '-c' }),
    })
    assert.equal(b.status, 201)
    second = (await b.json()).doc.id
    const cycle = await call(`/api/redirects/${second}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ to: prefix + '-a' }),
    })
    assert.equal(cycle.status, 400)
  } finally {
    await call(`/api/redirects/${first.id}`, { method: 'DELETE', headers })
    if (second) await call(`/api/redirects/${second}`, { method: 'DELETE', headers })
  }
})

test('media uploads generate compressed sizes and require alternative text', async () => {
  const { readFile } = await import('node:fs/promises')
  const token = await admin()
  const bytes = await readFile(new URL('../../public/clinic-hero.webp', import.meta.url))
  const body = new FormData()
  body.set('_payload', JSON.stringify({ alt: 'Interior contoh untuk uji media' }))
  body.set('file', new File([bytes], 'integration-media.webp', { type: 'image/webp' }))
  const response = await fetch(base + '/api/media', {
    method: 'POST',
    headers: { Authorization: `JWT ${token}`, Origin: base },
    body,
  })
  assert.equal(response.status, 201, await response.clone().text())
  const doc = (await response.json()).doc
  try {
    assert.equal(doc.mimeType, 'image/webp')
    assert.equal(doc.sizes.card.width, 640)
    assert.equal(doc.width, 1400)
    assert.equal(doc.sizes.hero.width, null) // Do not upscale images smaller than the target.
    const missing = await call(`/api/media/${doc.id}`, {
      method: 'PATCH',
      headers: { Authorization: `JWT ${token}` },
      body: JSON.stringify({ alt: '' }),
    })
    assert.equal(missing.status, 400)
  } finally {
    await call(`/api/media/${doc.id}`, {
      method: 'DELETE',
      headers: { Authorization: `JWT ${token}` },
    })
  }
})

const baseURL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

test('explicit detail routes and doctor bio links retain their URLs and metadata', async () => {
  for (const [collection, route] of [
    ['doctors', 'dokter'],
    ['locations', 'lokasi'],
    ['services', 'layanan'],
    ['articles', 'blog'],
    ['news', 'berita'],
  ]) {
    const response = await fetch(
      `${baseURL}/api/${collection}?where[_status][equals]=published&limit=1`,
    )
    assert.equal(response.status, 200)
    const document = (await response.json()).docs[0]
    assert(document, `Demo content required for ${collection}`)
    const path = `/${route}/${document.slug}`
    const page = await fetch(baseURL + path)
    assert.equal(page.status, 200, path)
    const html = await page.text()
    assert(html.includes(`href="${baseURL}${path}"`), `Canonical missing for ${path}`)
    assert(html.includes(document.title), `Content missing for ${path}`)
    if (collection === 'doctors') {
      const bio = await fetch(`${baseURL}/links/${document.slug}`)
      assert.equal(bio.status, 200)
      assert((await bio.text()).includes(document.title))
    }
  }
  for (const path of ['/dokter/tidak-ada-uji', '/links/tidak-ada-uji', '/booking/tidak-ada-uji']) {
    assert.equal((await fetch(baseURL + path)).status, 404, path)
  }
})

test('CMS fallback pages and legacy redirects work alongside explicit routes', async () => {
  assert.equal(process.env.NEXT_PUBLIC_DEMO_MODE, 'true', 'Use a demo database for this test')
  const login = await fetch(baseURL + '/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.SEED_ADMIN_EMAIL,
      password: process.env.SEED_ADMIN_PASSWORD,
    }),
  })
  assert.equal(login.status, 200)
  const { token } = await login.json()
  const headers = {
    'Content-Type': 'application/json',
    Origin: baseURL,
    Authorization: `JWT ${token}`,
  }
  const slug = `routing-test-${crypto.randomUUID().slice(0, 8)}`
  let pageId: number | undefined
  let redirectId: number | undefined
  try {
    const created = await fetch(baseURL + '/api/pages', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: 'Halaman CMS pengujian routing',
        slug,
        summary: 'Halaman sementara untuk memeriksa fallback CMS.',
        seo: {
          title: 'Halaman CMS pengujian routing',
          description: 'Pengujian routing halaman CMS.',
        },
        _status: 'published',
      }),
    })
    assert.equal(created.status, 201, await created.clone().text())
    pageId = (await created.json()).doc.id
    const page = await fetch(`${baseURL}/${slug}`)
    assert.equal(page.status, 200)
    assert((await page.text()).includes('Halaman CMS pengujian routing'))

    const from = `/arsip/${slug}`
    const redirected = await fetch(baseURL + '/api/redirects', {
      method: 'POST',
      headers,
      body: JSON.stringify({ from, to: '/booking' }),
    })
    assert.equal(redirected.status, 201, await redirected.clone().text())
    redirectId = (await redirected.json()).doc.id
    const legacy = await fetch(baseURL + from, { redirect: 'manual' })
    assert.equal(legacy.status, 308)
    assert.equal(new URL(legacy.headers.get('location')!, baseURL).pathname, '/booking')
  } finally {
    if (redirectId)
      await fetch(`${baseURL}/api/redirects/${redirectId}`, { method: 'DELETE', headers })
    if (pageId) await fetch(`${baseURL}/api/pages/${pageId}`, { method: 'DELETE', headers })
  }
})

test('public content cache follows publication, edits and deletion', async () => {
  const headers = { Authorization: `JWT ${await admin()}` }
  const slug = `cache-test-${crypto.randomUUID().slice(0, 8)}`
  let id: number | undefined
  try {
    assert.equal((await call(`/${slug}`)).status, 404)
    const created = await call('/api/pages', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: 'Konten cache pertama',
        summary: 'Konten sementara untuk menguji invalidasi cache.',
        slug,
        seo: { title: 'Konten cache pertama', description: 'Pengujian perubahan konten publik.' },
        _status: 'published',
      }),
    })
    assert.equal(created.status, 201, await created.clone().text())
    id = (await created.json()).doc.id
    assert((await (await call(`/${slug}`)).text()).includes('Konten cache pertama'))
    const updated = await call(`/api/pages/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ title: 'Konten cache diperbarui' }),
    })
    assert.equal(updated.status, 200, await updated.clone().text())
    assert((await (await call(`/${slug}`)).text()).includes('Konten cache diperbarui'))
    assert.equal(
      (
        await call(`/api/pages/${id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ _status: 'draft' }),
        })
      ).status,
      200,
    )
    assert.equal((await call(`/${slug}`)).status, 404)
    assert.equal(
      (
        await call(`/api/pages/${id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ _status: 'published' }),
        })
      ).status,
      200,
    )
    assert.equal((await call(`/${slug}`)).status, 200)
    assert.equal((await call(`/api/pages/${id}`, { method: 'DELETE', headers })).status, 200)
    id = undefined
    assert.equal((await call(`/${slug}`)).status, 404)
  } finally {
    if (id) await call(`/api/pages/${id}`, { method: 'DELETE', headers })
  }
})

test('booking options refresh after schedule creation, edits and deletion', async () => {
  const headers = { Authorization: `JWT ${await admin()}` }
  const options = await call('/api/booking-options')
  assert.equal(options.headers.get('cache-control'), 'no-store')
  const original = (await options.json())[0]
  let id: number | undefined
  const read = async () =>
    (await (await call('/api/booking-options')).json()) as { id: number; fee: number }[]
  try {
    const created = await call('/api/schedules', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        doctor: original.doctor.id,
        location: original.location.id,
        service: original.service.id,
        day: 2,
        start: '10:00',
        end: '11:00',
        fee: 234000,
        active: true,
      }),
    })
    assert.equal(created.status, 201, await created.clone().text())
    id = (await created.json()).doc.id
    assert.equal((await read()).find((schedule) => schedule.id === id)?.fee, 234000)
    assert.equal(
      (
        await call(`/api/schedules/${id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ fee: 345000 }),
        })
      ).status,
      200,
    )
    assert.equal((await read()).find((schedule) => schedule.id === id)?.fee, 345000)
    assert.equal(
      (
        await call(`/api/schedules/${id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ active: false }),
        })
      ).status,
      200,
    )
    assert(!(await read()).some((schedule) => schedule.id === id))
    assert.equal(
      (
        await call(`/api/schedules/${id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ active: true }),
        })
      ).status,
      200,
    )
    assert((await read()).some((schedule) => schedule.id === id))
    assert.equal((await call(`/api/schedules/${id}`, { method: 'DELETE', headers })).status, 200)
    assert(!(await read()).some((schedule) => schedule.id === id))
    id = undefined
  } finally {
    if (id) await call(`/api/schedules/${id}`, { method: 'DELETE', headers })
  }
})

test('settings changes refresh the public layout', async () => {
  const headers = { Authorization: `JWT ${await admin()}` }
  const settings = await (await call('/api/globals/settings', { headers })).json()
  await call('/kontak')
  const name = `Klinik Pengujian ${crypto.randomUUID().slice(0, 8)}`
  try {
    assert.equal(
      (
        await call('/api/globals/settings', {
          method: 'POST',
          headers,
          body: JSON.stringify({ name }),
        })
      ).status,
      200,
    )
    assert((await (await call('/kontak')).text()).includes(name))
  } finally {
    await call('/api/globals/settings', {
      method: 'POST',
      headers,
      body: JSON.stringify({ name: settings.name }),
    })
  }
})

test('SEO audit recognizes doctor bios and a file route without any route registration', async () => {
  const headers = { Authorization: `JWT ${await admin()}` }
  const doctor = (await (await call('/api/doctors?limit=1')).json()).docs[0]
  const slug = `audit-test-${crypto.randomUUID().slice(0, 8)}`
  let id: number | undefined
  try {
    const created = await call('/api/pages', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        title: 'Pengujian audit tautan',
        slug,
        summary: 'Pengujian halaman file tanpa registrasi route.',
        sections: [
          {
            heading: 'Tautan',
            text: 'Tautan untuk pengujian.',
            links: [
              { label: 'Bio dokter', href: `/links/${doctor.slug}` },
              { label: 'Halaman file', href: '/uji-route-file' },
              { label: 'Tidak tersedia', href: '/halaman-tidak-tersedia-untuk-audit' },
            ],
          },
        ],
        seo: {
          title: 'Pengujian audit tautan',
          description: 'Pengujian halaman file tanpa registrasi route.',
        },
        _status: 'published',
      }),
    })
    assert.equal(created.status, 201, await created.clone().text())
    id = (await created.json()).doc.id
    const response = await call('/api/seo-audit', { headers })
    assert.equal(response.status, 200)
    const audited = (await response.json()).pages.find(
      (page: { path: string }) => page.path === `/${slug}`,
    )
    assert(audited)
    assert.deepEqual(audited.brokenInternalLinks, ['/halaman-tidak-tersedia-untuk-audit'])
    assert.deepEqual(audited.unverifiedInternalLinks, [])
  } finally {
    if (id) await call(`/api/pages/${id}`, { method: 'DELETE', headers })
  }
})
