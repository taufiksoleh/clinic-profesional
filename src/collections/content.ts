import { editContent, isManager, isStaff, publishedOrStaff } from '@/lib/access'
import type { CollectionConfig, Field } from 'payload'
import { invalidateContent } from './hooks/cache'
import { contentFields, medicalFields } from './fields/content'
import { updateContentRedirects, validateContent } from './hooks/content'
function createContentCollection(
  slug: string,
  label: string,
  fields: Field[] = [],
): CollectionConfig {
  return {
    slug,
    labels: { singular: label, plural: label },
    admin: {
      useAsTitle: 'title',
      group: 'Konten',
      defaultColumns: ['title', '_status', 'seoScore', 'updatedAt'],
    },
    access: { read: publishedOrStaff, create: isStaff, update: editContent, delete: isManager },
    versions: { drafts: { schedulePublish: true }, maxPerDoc: 20 },
    hooks: {
      beforeChange: [validateContent],
      afterChange: [updateContentRedirects, invalidateContent],
      afterDelete: [invalidateContent],
    },
    fields: [...contentFields, ...fields],
  }
}
export const Doctors = createContentCollection('doctors', 'Dokter', [
  { name: 'specialty', label: 'Spesialisasi', type: 'text', required: true },
  { name: 'education', label: 'Pendidikan', type: 'textarea' },
  { name: 'experience', label: 'Pengalaman', type: 'textarea' },
  { name: 'services', type: 'relationship', relationTo: 'services', hasMany: true },
  {
    name: 'links',
    type: 'array',
    fields: [
      { name: 'label', type: 'text', required: true },
      {
        name: 'url',
        type: 'text',
        required: true,
        validate: (value: unknown) => /^https:\/\//.test(String(value)) || 'Gunakan URL HTTPS.',
      },
    ],
  },
])
export const Locations = createContentCollection('locations', 'Lokasi', [
  { name: 'address', label: 'Alamat', type: 'textarea', required: true },
  { name: 'city', label: 'Kota', type: 'text', required: true },
  { name: 'hours', label: 'Jam operasional', type: 'text', required: true },
  { name: 'phone', type: 'text' },
  { name: 'latitude', type: 'number', min: -90, max: 90, required: true },
  { name: 'longitude', type: 'number', min: -180, max: 180, required: true },
])
export const Services = createContentCollection('services', 'Layanan', medicalFields)
export const Articles = createContentCollection('articles', 'Artikel', [
  ...medicalFields,
  { name: 'services', type: 'relationship', relationTo: 'services', hasMany: true },
  {
    name: 'publishedAt',
    type: 'date',
    required: true,
    defaultValue: () => new Date().toISOString(),
  },
])
export const News = createContentCollection('news', 'Berita', [
  { name: 'publishedAt', type: 'date', defaultValue: () => new Date().toISOString() },
])
export const Pages = createContentCollection('pages', 'Halaman')
