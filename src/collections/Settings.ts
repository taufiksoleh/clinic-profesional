import { invalidateSettings } from './hooks/cache'
import { isAdmin } from '@/lib/access'
import type { GlobalConfig } from 'payload'
export const Settings: GlobalConfig = {
  slug: 'settings',
  label: 'Pengaturan Klinik',
  hooks: { afterChange: [invalidateSettings] },
  access: { read: () => true, update: isAdmin },
  fields: [
    { name: 'name', type: 'text', required: true, defaultValue: 'Klinik Ruang Gerak' },
    { name: 'tagline', type: 'text', defaultValue: 'Ruang untuk kembali bergerak.' },
    {
      name: 'description',
      type: 'textarea',
      defaultValue:
        'Temukan layanan, dokter, dan lokasi praktik. Ajukan jadwal konsultasi dengan informasi biaya yang jelas.',
    },
    { name: 'email', type: 'email' },
    { name: 'phone', type: 'text' },
    { name: 'address', type: 'textarea' },
    { name: 'privacyVersion', type: 'text', defaultValue: '2026-10-04' },
    { name: 'searchConsoleVerification', type: 'text' },
    {
      name: 'pageSEO',
      label: 'SEO halaman utama & daftar',
      type: 'array',
      fields: [
        {
          name: 'path',
          type: 'select',
          required: true,
          options: [
            '/',
            '/booking',
            '/dokter',
            '/lokasi',
            '/layanan',
            '/blog',
            '/berita',
            '/kontak',
            '/links',
          ],
        },
        { name: 'title', type: 'text', required: true, maxLength: 65 },
        { name: 'description', type: 'textarea', required: true, maxLength: 160 },
        {
          name: 'canonical',
          type: 'text',
          validate: (v: unknown) => !v || /^https:\/\//.test(String(v)) || 'Gunakan URL HTTPS.',
        },
        { name: 'noindex', type: 'checkbox' },
        { name: 'image', type: 'upload', relationTo: 'media' },
      ],
    },
    {
      name: 'links',
      type: 'array',
      fields: [
        { name: 'label', type: 'text', required: true },
        {
          name: 'url',
          type: 'text',
          required: true,
          validate: (v: unknown) => /^https:\/\//.test(String(v)) || 'URL harus HTTPS',
        },
      ],
    },
  ],
}
