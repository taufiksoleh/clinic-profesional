import type { ContentCollection } from './content'
export const routes: Record<ContentCollection, string> = {
  doctors: 'dokter',
  locations: 'lokasi',
  services: 'layanan',
  articles: 'blog',
  news: 'berita',
  pages: '',
}
