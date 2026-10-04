import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { test } from 'node:test'
import {
  applyMedicalReview,
  getReviewHash,
  validatePublication,
  type ReviewContent,
} from '../../src/server/content/medical-review'

const draft: ReviewContent = {
  id: 1,
  title: 'Judul medis',
  summary: 'Ringkasan',
  sections: [{ heading: 'Bagian', text: 'Isi', links: [{ label: 'Tautan', href: '/booking' }] }],
  faqs: [{ question: 'Pertanyaan', answer: 'Jawaban' }],
  seo: { title: 'SEO', description: 'Deskripsi SEO' },
  _status: 'draft',
  reviewState: 'pending',
}
const now = new Date('2026-10-04T00:00:00Z')
function approvedContent(): ReviewContent {
  return {
    ...draft,
    ...applyMedicalReview({
      original: draft,
      changes: { reviewer: 2, reviewState: 'approved' },
      canApprove: true,
      now,
    }),
    _status: 'published',
  }
}

test('review hash preserves the persisted serialization format', () => {
  const persisted = createHash('sha256')
    .update(
      JSON.stringify([
        'Judul medis',
        'Ringkasan',
        [['Bagian', 'Isi', [['Tautan', '/booking']]]],
        [['Pertanyaan', 'Jawaban']],
      ]),
    )
    .digest('hex')
  assert.equal(getReviewHash(draft), persisted)
  assert.equal(getReviewHash({ ...draft, seo: { title: 'New SEO' } }), persisted)
})
test('publication requires SEO and a valid medical approval', () => {
  assert.throws(
    () => validatePublication({ ...draft, _status: 'published' }, true),
    /ditinjau medis/,
  )
  assert.throws(() => validatePublication({ ...approvedContent(), seo: {} }, true), /SEO wajib/)
  assert.doesNotThrow(() => validatePublication(approvedContent(), true))
  assert.doesNotThrow(() => validatePublication({ ...draft, _status: 'published' }, false))
})
test('review approval requires permission and a reviewer', () => {
  assert.throws(
    () =>
      applyMedicalReview({
        original: draft,
        changes: { reviewState: 'approved', reviewer: 2 },
        canApprove: false,
      }),
    /peninjau medis/,
  )
  assert.throws(
    () =>
      applyMedicalReview({
        original: draft,
        changes: { reviewState: 'approved' },
        canApprove: true,
      }),
    /Pilih dokter/,
  )
  assert.equal(approvedContent().reviewedAt, now.toISOString())
})
test('medical edits revoke approval even when publication is requested at the same time', () => {
  const original = approvedContent()
  const changes: ReviewContent = {
    summary: 'Isi diubah',
    _status: 'published',
    reviewState: 'approved',
  }
  const updated = applyMedicalReview({ original, changes, canApprove: true, now })
  assert.equal(updated._status, 'draft')
  assert.equal(updated.reviewState, 'pending')
  assert.equal(updated.reviewer, null)
  assert.equal(updated.reviewedAt, null)
  assert.equal(updated.reviewHash, null)
  assert.equal(original.reviewState, 'approved')
  assert.equal(changes.reviewState, 'approved')
})
test('metadata changes retain approval while text, related links and FAQs invalidate it', () => {
  const original = approvedContent()
  const metadata = applyMedicalReview({
    original,
    changes: { seo: { title: 'Revised SEO' } },
    canApprove: false,
  })
  assert.equal({ ...original, ...metadata }.reviewHash, original.reviewHash)
  for (const changes of [
    { title: 'Judul diubah' },
    { sections: [{ heading: 'Bagian', text: 'Isi berubah' }] },
    {
      sections: [{ heading: 'Bagian', text: 'Isi', links: [{ label: 'Tautan', href: '/dokter' }] }],
    },
    { faqs: [{ question: 'Pertanyaan', answer: 'Jawaban baru' }] },
  ]) {
    assert.equal(
      applyMedicalReview({ original, changes, canApprove: false }).reviewState,
      'pending',
    )
  }
})
