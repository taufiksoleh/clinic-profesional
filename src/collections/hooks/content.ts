import {
  applyMedicalReview,
  validatePublication,
  ContentValidationError,
} from '@/server/content/medical-review'
import { canPublishContent, canReviewMedicalContent } from '@/lib/permissions'
import { routes } from '@/lib/content-routes'
import { auditSEO, slugify } from '@/lib/seo'
import { APIError, type CollectionAfterChangeHook, type CollectionBeforeChangeHook } from 'payload'
export const validateContent: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req: request,
  collection,
  operation,
}) => {
  data.author = originalDoc?.author?.id || originalDoc?.author || request.user?.id || data.author
  data.slug = slugify(data.slug || originalDoc?.slug || data.title || '')
  if (
    collection.slug === 'pages' &&
    [
      'booking',
      'kontak',
      'links',
      'dokter',
      'lokasi',
      'layanan',
      'blog',
      'berita',
      'admin',
      'api',
    ].includes(data.slug)
  )
    throw new APIError('URL ini digunakan halaman sistem. Atur SEO-nya di Pengaturan Klinik.', 400)
  if (!data.slug) throw new APIError('URL halaman wajib diisi.', 400)
  if (data._status === 'published' && request.user && !canPublishContent(request.user))
    throw new APIError('Hanya Admin atau Editor SEO yang dapat menerbitkan.', 400)
  const requiresMedicalReview = ['articles', 'services'].includes(collection.slug)
  try {
    if (requiresMedicalReview) {
      Object.assign(
        data,
        applyMedicalReview({
          original: operation === 'update' ? originalDoc : undefined,
          changes: data,
          canApprove: canReviewMedicalContent(request.user) || !!request.context.seed,
        }),
      )
    }
    if (
      (data._status || originalDoc?._status) === 'published' &&
      request.user &&
      !canPublishContent(request.user)
    ) {
      throw new ContentValidationError('Hanya Admin atau Editor SEO yang dapat menerbitkan.')
    }
    if ((data._status || originalDoc?._status) === 'published') {
      validatePublication({ ...originalDoc, ...data, _status: 'published' }, requiresMedicalReview)
    }
  } catch (error) {
    if (error instanceof ContentValidationError) throw new APIError(error.message, 400)
    throw error
  }
  if (operation === 'create' && !request.context.seed && !data._status) data._status = 'draft'
  data.seoScore = auditSEO({ ...originalDoc, ...data }).score
  return data
}
export const updateContentRedirects: CollectionAfterChangeHook = async ({
  doc: document,
  previousDoc,
  req: request,
  collection,
}) => {
  if (previousDoc?.slug && previousDoc.slug !== document.slug) {
    const prefix = routes[collection.slug as keyof typeof routes]
    const from = `/${prefix ? prefix + '/' : ''}${previousDoc.slug}`
    const to = `/${prefix ? prefix + '/' : ''}${document.slug}`
    // A reused slug is canonical again; old incoming links follow its new location.
    await request.payload.delete({
      collection: 'redirects',
      where: { from: { equals: to } },
      req: request,
    })
    await request.payload.update({
      collection: 'redirects',
      where: { to: { equals: from } },
      data: { to },
      req: request,
    })
    const existing = await request.payload.find({
      collection: 'redirects',
      where: { from: { equals: from } },
      limit: 1,
      req: request,
    })
    if (existing.docs[0])
      await request.payload.update({
        collection: 'redirects',
        id: existing.docs[0].id,
        data: { to },
        req: request,
      })
    else await request.payload.create({ collection: 'redirects', data: { from, to }, req: request })
  }
  return document
}
