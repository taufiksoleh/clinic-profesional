import { createHash } from 'node:crypto'
import type { Service } from '@/payload-types'

export type ReviewContent = Partial<
  Pick<
    Service,
    | 'id'
    | 'title'
    | 'summary'
    | 'sections'
    | 'faqs'
    | 'reviewState'
    | 'reviewer'
    | 'reviewedAt'
    | 'reviewHash'
    | '_status'
    | 'seo'
  >
>

export class ContentValidationError extends Error {}

export const getReviewHash = (document: ReviewContent) =>
  createHash('sha256')
    .update(
      JSON.stringify([
        document.title,
        document.summary,
        document.sections?.map((section) => [
          section.heading,
          section.text,
          section.links?.map((link) => [link.label, link.href]),
        ]),
        document.faqs?.map((f) => [f.question, f.answer]),
      ]),
    )
    .digest('hex')

export function applyMedicalReview({
  original,
  changes,
  canApprove,
  now = new Date(),
}: {
  original?: ReviewContent
  changes: ReviewContent
  canApprove: boolean
  now?: Date
}): ReviewContent {
  const updatedContent = { ...original, ...changes }
  const review = { ...changes }
  const contentChanged = !!original?.id && getReviewHash(updatedContent) !== getReviewHash(original)
  if (contentChanged) {
    review.reviewState = 'pending'
    review.reviewedAt = null
    review.reviewer = null
    review.reviewHash = null
    review._status = 'draft'
  }
  if (
    review.reviewState === 'approved' &&
    (original?.reviewState !== 'approved' || contentChanged)
  ) {
    if (!canApprove)
      throw new ContentValidationError('Persetujuan hanya dapat diberikan oleh peninjau medis.')
    if (!updatedContent.reviewer)
      throw new ContentValidationError('Pilih dokter peninjau sebelum menyetujui.')
    review.reviewer = updatedContent.reviewer
    review.reviewedAt = now.toISOString()
    review.reviewHash = getReviewHash(updatedContent)
  }
  return review
}

export function validatePublication(document: ReviewContent, requiresMedicalReview: boolean) {
  if (document._status !== 'published') return
  if (!document.seo?.title || !document.seo?.description) {
    throw new ContentValidationError('Judul dan deskripsi SEO wajib sebelum terbit.')
  }
  if (
    requiresMedicalReview &&
    (document.reviewState !== 'approved' || document.reviewHash !== getReviewHash(document))
  ) {
    throw new ContentValidationError('Konten harus ditinjau medis sebelum terbit.')
  }
}
