import type { Page } from '@/payload-types'
export type Section = NonNullable<Page['sections']>[number]
export type SEOData = NonNullable<Page['seo']>
export function auditSEO(document: {
  title?: string
  slug?: string
  summary?: string
  seo?: SEOData
  sections?: Section[] | null
  image?: unknown
}) {
  const checks = [
    {
      name: 'Judul SEO 30–65 karakter',
      ok: (document.seo?.title?.length || 0) >= 30 && (document.seo?.title?.length || 0) <= 65,
    },
    {
      name: 'Deskripsi SEO 80–160 karakter',
      ok:
        (document.seo?.description?.length || 0) >= 80 &&
        (document.seo?.description?.length || 0) <= 160,
    },
    { name: 'URL singkat tersedia', ok: !!document.slug && document.slug.length <= 80 },
    { name: 'Judul halaman (H1) tersedia', ok: !!document.title },
    { name: 'Ringkasan tersedia', ok: !!document.summary },
    { name: 'Subjudul konten tersedia', ok: !!document.sections?.length },
    {
      name: 'Gambar memiliki teks alternatif',
      ok:
        !document.image ||
        typeof document.image === 'number' ||
        !!(document.image as { alt?: string })?.alt,
    },
  ]
  return { score: Math.round((checks.filter((c) => c.ok).length / checks.length) * 100), checks }
}
export function safeInternalPath(value: string) {
  return (
    /^\/(?!\/)[a-zA-Z0-9/_-]*$/.test(value) &&
    !value.startsWith('/api') &&
    !value.startsWith('/admin')
  )
}
export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
export function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}
export const money = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n)
