import type { ContentCollection } from './content'
export const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
export const categories: Record<
  string,
  { collection: ContentCollection; title: string; description: string }
> = {
  dokter: {
    collection: 'doctors',
    title: 'Temukan dokter Anda.',
    description: 'Kenali dokter, bidang keahlian, dan jadwal praktik sebelum membuat janji.',
  },
  lokasi: {
    collection: 'locations',
    title: 'Lebih dekat dengan Anda.',
    description: 'Pilih lokasi praktik yang sesuai dengan perjalanan dan keseharian Anda.',
  },
  layanan: {
    collection: 'services',
    title: 'Mulai dari yang Anda rasakan.',
    description: 'Kenali layanan dan pilihan konsultasi yang tersedia bersama tim medis.',
  },
  blog: {
    collection: 'articles',
    title: 'Kenali tubuh. Pahami pilihan.',
    description: 'Pusat edukasi dengan proses tinjauan medis sebelum publikasi.',
  },
  berita: {
    collection: 'news',
    title: 'Kabar dari klinik.',
    description: 'Informasi terbaru tentang layanan dan kegiatan klinik.',
  },
}
