import { canReviewMedicalContent } from '@/lib/permissions'
import { safeInternalPath } from '@/lib/seo'
import type { Field } from 'payload'
export const contentFields: Field[] = [
  { name: 'title', label: 'Judul / Nama', type: 'text', required: true },
  { name: 'slug', label: 'URL', type: 'text', required: true, unique: true, index: true },
  { name: 'summary', label: 'Ringkasan', type: 'textarea', required: true },
  { name: 'image', label: 'Foto', type: 'upload', relationTo: 'media' },
  {
    name: 'sections',
    label: 'Isi halaman',
    type: 'array',
    fields: [
      { name: 'heading', label: 'Subjudul', type: 'text', required: true },
      { name: 'text', label: 'Isi', type: 'textarea', required: true },
      {
        name: 'links',
        label: 'Tautan terkait',
        type: 'array',
        fields: [
          { name: 'label', type: 'text', required: true },
          {
            name: 'href',
            type: 'text',
            required: true,
            validate: (v: unknown) =>
              safeInternalPath(String(v)) ||
              /^https:\/\//.test(String(v)) ||
              'Gunakan path internal atau URL HTTPS.',
          },
        ],
      },
    ],
  },
  {
    name: 'faqs',
    label: 'Pertanyaan umum',
    type: 'array',
    fields: [
      { name: 'question', type: 'text', required: true },
      { name: 'answer', type: 'textarea', required: true },
    ],
  },
  {
    name: 'seo',
    label: 'Pengaturan SEO',
    type: 'group',
    fields: [
      { name: 'title', type: 'text', maxLength: 65 },
      { name: 'description', type: 'textarea', maxLength: 160 },
      {
        name: 'canonical',
        type: 'text',
        validate: (value: unknown) =>
          !value || /^https:\/\//.test(String(value)) || 'Gunakan URL HTTPS lengkap.',
      },
      { name: 'noindex', type: 'checkbox', defaultValue: false },
      { name: 'image', label: 'Gambar Open Graph', type: 'upload', relationTo: 'media' },
    ],
  },
  { name: 'seoScore', type: 'number', admin: { readOnly: true, position: 'sidebar' } },
  {
    name: 'author',
    type: 'relationship',
    relationTo: 'users',
    admin: { readOnly: true, position: 'sidebar' },
  },
]
export const medicalFields: Field[] = [
  {
    name: 'reviewState',
    label: 'Tinjauan medis',
    type: 'select',
    defaultValue: 'pending',
    options: [
      { label: 'Menunggu tinjauan', value: 'pending' },
      { label: 'Disetujui', value: 'approved' },
    ],
    access: {
      update: ({ req: request }) => canReviewMedicalContent(request.user),
      create: ({ req: request }) => canReviewMedicalContent(request.user),
    },
  },
  {
    name: 'reviewer',
    label: 'Dokter peninjau',
    type: 'relationship',
    relationTo: 'doctors',
    access: {
      update: ({ req: request }) => canReviewMedicalContent(request.user),
      create: ({ req: request }) => canReviewMedicalContent(request.user),
    },
  },
  {
    name: 'reviewedAt',
    type: 'date',
    admin: { readOnly: true },
    access: { update: () => false, create: () => false },
  },
  {
    name: 'reviewHash',
    type: 'text',
    admin: { hidden: true },
    access: { update: () => false, create: () => false },
  },
]
