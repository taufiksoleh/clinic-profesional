import { getPayload } from 'payload'
import config from '../../src/payload.config'
import { requireTestEnvironment } from '../helpers/environment'

requireTestEnvironment()
const payload = await getPayload({ config })
try {
  const user = await payload.create({
    collection: 'users',
    data: {
      email: process.env.SEED_ADMIN_EMAIL!,
      password: process.env.SEED_ADMIN_PASSWORD!,
      name: 'Test administrator',
      role: 'admin',
    },
  })
  const req = { user: { ...user, collection: 'users' as const }, context: { seed: true } }
  const content = (title: string, slug: string) => ({
    title,
    slug,
    summary: `Informasi ${title} untuk pengujian.`,
    sections: [{ heading: 'Informasi', text: 'Konten pengujian yang terpisah dari data klinik.' }],
    seo: { title, description: `Informasi ${title} untuk pengujian aplikasi klinik.` },
    _status: 'published' as const,
  })
  const doctor = await payload.create({
    collection: 'doctors',
    req,
    data: { ...content('Dokter Pengujian', 'dokter-pengujian'), specialty: 'Rehabilitasi' },
  })
  const location = await payload.create({
    collection: 'locations',
    req,
    data: {
      ...content('Lokasi Pengujian', 'lokasi-pengujian'),
      address: 'Alamat Pengujian',
      city: 'Jakarta',
      hours: '09:00–17:00',
      latitude: -6.2,
      longitude: 106.8,
    },
  })
  const service = await payload.create({
    collection: 'services',
    req,
    data: {
      ...content('Layanan Pengujian', 'layanan-pengujian'),
      reviewer: doctor.id,
      reviewState: 'approved',
    },
  })
  await payload.create({
    collection: 'articles',
    req,
    data: {
      ...content('Artikel Pengujian', 'artikel-pengujian'),
      reviewer: doctor.id,
      reviewState: 'approved',
      services: [service.id],
      publishedAt: new Date().toISOString(),
    },
  })
  await payload.create({
    collection: 'news',
    req,
    data: content('Berita Pengujian', 'berita-pengujian'),
  })
  for (const slug of ['tentang', 'kebijakan-privasi']) {
    await payload.create({
      collection: 'pages',
      req,
      data: content(slug === 'tentang' ? 'Tentang Klinik' : 'Kebijakan Privasi', slug),
    })
  }
  await payload.create({
    collection: 'schedules',
    data: {
      doctor: doctor.id,
      location: location.id,
      service: service.id,
      day: 1,
      start: '09:00',
      end: '17:00',
      fee: 150000,
      active: true,
    },
  })
  console.log('Isolated test fixtures created.')
} finally {
  await payload.destroy()
}

process.exit(0)
