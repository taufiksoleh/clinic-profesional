import 'dotenv/config'
import { getPayload, type Where, type RequiredDataFromCollectionSlug } from 'payload'
import config from '../src/payload.config'
const p = await getPayload({ config })
if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true')
  throw Error('Seed contoh hanya boleh dijalankan pada DEMO_MODE=true.')
const email = process.env.SEED_ADMIN_EMAIL
const password = process.env.SEED_ADMIN_PASSWORD
if (!email || !password || password.length < 16)
  throw Error('Atur SEED_ADMIN_EMAIL dan SEED_ADMIN_PASSWORD minimal 16 karakter.')
const found = await p.find({ collection: 'users', where: { email: { equals: email } }, limit: 1 })
const user =
  found.docs[0] ||
  (await p.create({
    collection: 'users',
    data: { email, password, name: 'Administrator Klinik', role: 'admin' },
  }))
const req = { user: { ...user, collection: 'users' as const }, context: { seed: true } }
async function create(
  collection: 'doctors' | 'locations' | 'services' | 'articles' | 'news' | 'pages',
  data: Record<string, unknown>,
) {
  const r = await p.find({ collection, where: { slug: { equals: data.slug } }, limit: 1 })
  if (r.docs[0]) return r.docs[0]
  return p.create({
    collection,
    data: data as RequiredDataFromCollectionSlug<typeof collection>,
    req,
  })
}
const section = (heading: string, text: string) => ({ heading, text })
const seo = (title: string) => ({
  title: `${title} | Klinik Ruang Gerak`,
  description:
    `Kenali ${title.toLowerCase()} di Klinik Ruang Gerak. Temukan informasi layanan, dokter, lokasi praktik, jadwal, dan biaya konsultasi sebelum membuat janji.`.slice(
      0,
      160,
    ),
})
const a = await create('doctors', {
  title: 'dr. Maya Pratiwi, Sp.KFR',
  slug: 'maya-pratiwi',
  summary: 'Profil dokter contoh untuk memperagakan pencarian dokter dan alur konsultasi.',
  specialty: 'Kedokteran Fisik & Rehabilitasi',
  education: 'Data pendidikan dokter akan diisi oleh klinik.',
  experience: 'Data pengalaman dokter akan diverifikasi oleh klinik.',
  sections: [
    section(
      'Pendekatan konsultasi',
      'Profil ini merupakan data demonstrasi, bukan profil tenaga medis nyata. Informasi praktik dan kredensial harus diverifikasi sebelum website diluncurkan.',
    ),
  ],
  seo: seo('dr. Maya Pratiwi'),
  _status: 'published',
})
const b = await create('doctors', {
  title: 'dr. Arif Wicaksono, Sp.OT',
  slug: 'arif-wicaksono',
  summary: 'Profil dokter contoh untuk memperagakan informasi praktik dan biaya konsultasi.',
  specialty: 'Ortopedi & Traumatologi',
  education: 'Data pendidikan dokter akan diisi oleh klinik.',
  experience: 'Data pengalaman dokter akan diverifikasi oleh klinik.',
  sections: [
    section(
      'Tentang dokter',
      'Profil ini merupakan data demonstrasi dan tidak mewakili dokter nyata.',
    ),
  ],
  seo: seo('dr. Arif Wicaksono'),
  _status: 'published',
})
const c = await create('doctors', {
  title: 'dr. Nadia Putri, Sp.N',
  slug: 'nadia-putri',
  summary: 'Profil dokter contoh untuk memperagakan pilihan dokter dan lokasi konsultasi.',
  specialty: 'Neurologi',
  education: 'Data pendidikan dokter akan diisi oleh klinik.',
  sections: [
    section(
      'Tentang dokter',
      'Profil ini merupakan data demonstrasi dan tidak mewakili dokter nyata.',
    ),
  ],
  seo: seo('dr. Nadia Putri'),
  _status: 'published',
})
const locations = []
for (const d of [
  {
    title: 'Ruang Gerak · Jakarta',
    slug: 'jakarta',
    city: 'Jakarta',
    address: 'Alamat contoh area Kebayoran Baru, Jakarta Selatan (bukan lokasi operasional)',
    latitude: -6.244,
    longitude: 106.802,
  },
  {
    title: 'Ruang Gerak · Tangerang',
    slug: 'tangerang',
    city: 'Tangerang',
    address: 'Alamat contoh area BSD, Tangerang Selatan (bukan lokasi operasional)',
    latitude: -6.302,
    longitude: 106.652,
  },
])
  locations.push(
    await create('locations', {
      ...d,
      summary:
        'Lokasi contoh untuk pratinjau jaringan klinik. Alamat operasional akan diperbarui sebelum peluncuran.',
      hours: 'Senin–Sabtu, 08.00–18.00 WIB (contoh)',
      sections: [
        section(
          'Kunjungan ke klinik',
          'Konfirmasikan lokasi dan jadwal dengan admin sebelum berkunjung. Lokasi pada demonstrasi ini belum merupakan alamat klinik yang beroperasi.',
        ),
      ],
      seo: seo(d.title),
      _status: 'published',
    }),
  )
const services = []
for (const [title, slug] of [
  ['Konsultasi nyeri punggung', 'nyeri-punggung'],
  ['Konsultasi sendi & gerak', 'sendi-dan-gerak'],
  ['Konsultasi rehabilitasi', 'rehabilitasi'],
]) {
  const s = await create('services', {
    title,
    slug,
    summary:
      'Konsultasikan keluhan dan kebutuhan Anda bersama dokter. Konten contoh ini harus diganti dengan informasi yang ditinjau dokter klinik.',
    sections: [
      section(
        'Memahami keluhan Anda',
        'Ceritakan keluhan, kapan mulai dirasakan, dan bagaimana pengaruhnya terhadap kegiatan sehari-hari kepada dokter saat konsultasi.',
      ),
      section(
        'Persiapan konsultasi',
        'Siapkan catatan keluhan, daftar obat yang digunakan, dan dokumen pemeriksaan sebelumnya apabila tersedia.',
      ),
      section(
        'Pilihan penanganan',
        'Informasi layanan dan penanganan yang sebenarnya akan disusun serta disetujui oleh dokter klinik sebelum peluncuran. Halaman ini hanya memperagakan struktur konten.',
      ),
    ],
    faqs: [
      {
        question: 'Bagaimana cara membuat janji?',
        answer:
          'Pilih jadwal pada form di bawah ini. Admin akan menindaklanjuti permintaan Anda untuk mengonfirmasi waktu kunjungan.',
      },
    ],
    reviewer: a.id,
    reviewState: 'approved',
    seo: seo(title),
    _status: 'published',
  })
  services.push(s)
}
for (const [i, doctor] of [a, b, c].entries())
  for (const [j, l] of locations.entries()) {
    const where: Where = {
      and: [{ doctor: { equals: doctor.id } }, { location: { equals: l.id } }],
    }
    const existing = await p.find({ collection: 'schedules', where, limit: 1 })
    if (!existing.docs.length)
      await p.create({
        collection: 'schedules',
        data: {
          doctor: doctor.id,
          location: l.id,
          service: services[i].id,
          day: i + j + 1,
          start: '09:00',
          end: '12:00',
          fee: 250000 + i * 50000,
          active: true,
        },
      })
  }
for (const [title, slug] of [
  ['Menyiapkan kunjungan pertama Anda', 'persiapan-kunjungan'],
  ['Mengenal alur konsultasi di klinik', 'alur-konsultasi'],
  ['Memilih jadwal yang sesuai', 'memilih-jadwal'],
])
  await create('articles', {
    title,
    slug,
    summary:
      'Panduan contoh untuk mengenal alur kunjungan. Konten editorial sebenarnya akan disiapkan dan ditinjau oleh dokter klinik.',
    sections: [
      section(
        'Sebelum kunjungan',
        'Pilih dokter, lokasi, dan jadwal yang diinginkan. Setelah permintaan tersimpan, admin akan membantu mengonfirmasi jadwal Anda.',
      ),
      section(
        'Saat konsultasi',
        'Gunakan waktu konsultasi untuk menceritakan kebutuhan dan mengajukan pertanyaan kepada dokter.',
      ),
      section(
        'Sesudah konsultasi',
        'Ikuti arahan yang diberikan dokter Anda. Halaman demonstrasi ini tidak memberikan nasihat atau rekomendasi medis.',
      ),
    ],
    reviewer: a.id,
    reviewState: 'approved',
    services: [services[0].id],
    publishedAt: new Date().toISOString(),
    seo: seo(title),
    _status: 'published',
  })
await create('news', {
  title: 'Selamat datang di website klinik',
  slug: 'selamat-datang',
  summary:
    'Website demonstrasi untuk mengenal fitur layanan, pencarian dokter, dan booking konsultasi.',
  sections: [
    section(
      'Informasi lebih mudah diakses',
      'Temukan dokter, lokasi, dan jadwal melalui website. Seluruh data dalam pratinjau ini adalah contoh.',
    ),
  ],
  seo: seo('Informasi website klinik'),
  _status: 'published',
})
await create('pages', {
  title: 'Tentang Klinik Ruang Gerak',
  slug: 'tentang',
  summary:
    'Ruang untuk memahami kebutuhan kesehatan Anda, dengan informasi yang mudah diakses dan proses konsultasi yang jelas.',
  sections: [
    section(
      'Tentang kami',
      'Klinik Ruang Gerak adalah identitas contoh pada aplikasi ini. Profil, visi, izin, fasilitas, dan tim klinik akan dilengkapi sesuai data resmi pemilik klinik.',
    ),
    section(
      'Informasi yang dapat Anda periksa',
      'Lihat profil dokter, jadwal praktik, lokasi, dan biaya konsultasi sebelum mengajukan janji. Tim admin menindaklanjuti setiap permintaan untuk memastikan jadwal kunjungan.',
    ),
  ],
  seo: seo('Tentang klinik kami'),
  _status: 'published',
})
await create('pages', {
  title: 'Kebijakan Privasi',
  slug: 'kebijakan-privasi',
  summary:
    'Draf kebijakan pengelolaan data untuk ditinjau dan dilengkapi oleh pengelola klinik sebelum menerima data pasien nyata.',
  sections: [
    section(
      'Data yang dikumpulkan',
      'Form konsultasi meminta nama, nomor WhatsApp, pilihan jadwal, dan persetujuan Anda. Sumber kunjungan seperti kampanye dan domain rujukan dicatat untuk memahami asal permintaan.',
    ),
    section(
      'Penggunaan dan akses',
      'Data dipakai untuk menindaklanjuti permintaan konsultasi. Akses daftar booking dibatasi pada Admin dan Editor SEO. Data tidak ditampilkan kepada pengunjung website.',
    ),
    section(
      'Layanan eksternal dan analitik',
      'Jika Anda mengizinkan analitik opsional, event kunjungan dan booking dapat dikirim ke Google Analytics dan Meta. Nomor WhatsApp dan nama tidak dikirim melalui analitik. Tautan WhatsApp membawa nomor referensi booking. Peta ditampilkan melalui OpenStreetMap.',
    ),
    section(
      'Retensi dan hak Anda',
      'Pengelola harus menetapkan masa simpan, kontak privasi, serta prosedur akses, koreksi, dan penghapusan sebelum peluncuran. Hubungi kontak resmi pada halaman Kontak untuk permintaan terkait data.',
    ),
    section(
      'Status dokumen',
      'Dokumen ini adalah draf operasional contoh, bukan kebijakan final klinik. Jangan mengirim data pasien nyata ke lingkungan demonstrasi.',
    ),
  ],
  seo: seo('Kebijakan Privasi Klinik'),
  _status: 'published',
})
await p.updateGlobal({
  slug: 'settings',
  data: {
    name: 'Klinik Ruang Gerak',
    tagline: 'Ruang untuk kembali bergerak.',
    description:
      'Temukan layanan, dokter, dan lokasi praktik. Ajukan jadwal konsultasi dengan informasi biaya yang jelas.',
    privacyVersion: '2026-10-04',
  },
})
console.log('Data demo siap. Login admin menggunakan kredensial SEED_ADMIN_* pada .env.')
await p.destroy()
process.exit(0)
