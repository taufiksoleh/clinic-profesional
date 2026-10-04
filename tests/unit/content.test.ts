import assert from 'node:assert/strict'
import { test } from 'node:test'
import { hasPublishedRelationships, toPublicContent, toPublicSchedule } from '../../src/lib/content'
import type { Article, Doctor, Location, Schedule, Service } from '../../src/payload-types'

const content = {
  id: 1,
  title: 'Konten uji',
  slug: 'konten-uji',
  summary: 'Ringkasan',
  createdAt: '2026-10-04T00:00:00Z',
  updatedAt: '2026-10-04T00:00:00Z',
  _status: 'published' as const,
}
const doctor: Doctor = { ...content, specialty: 'Rehabilitasi' }
const location: Location = {
  ...content,
  address: 'Alamat uji',
  city: 'Jakarta',
  hours: '09:00–16:00',
  latitude: -6.2,
  longitude: 106.8,
}
const service: Service = { ...content }
const schedule: Schedule = {
  id: 1,
  doctor,
  location,
  service,
  day: 1,
  start: '09:00',
  end: '12:00',
  fee: 150000,
  active: true,
  createdAt: content.createdAt,
  updatedAt: content.updatedAt,
}

test('public schedules require all three relationships to be loaded and published', () => {
  assert(hasPublishedRelationships(schedule))
  for (const relationship of ['doctor', 'location', 'service'] as const) {
    assert(!hasPublishedRelationships({ ...schedule, [relationship]: 1 }))
    assert(
      !hasPublishedRelationships({
        ...schedule,
        [relationship]: { ...(schedule[relationship] as object), _status: 'draft' },
      }),
    )
  }
})

test('public content handles nullable fields and unresolved relationship IDs', () => {
  const article: Article = {
    ...content,
    publishedAt: content.createdAt,
    sections: null,
    faqs: null,
    image: 12,
    reviewer: 10,
    services: [2, service],
  }
  const page = toPublicContent('articles', article)
  assert.equal(page.image, undefined)
  assert.equal(page.reviewer, undefined)
  assert.equal(page.sections, null)
  assert.deepEqual(
    page.services?.map((service) => service.id),
    [1],
  )
  assert.deepEqual(article.services, [2, service])
})

test('public content preserves populated review, media and SEO information', () => {
  const image = { ...content, alt: 'Gambar uji', url: '/api/media/file/test.webp' }
  const article: Article = {
    ...content,
    publishedAt: content.createdAt,
    reviewer: doctor,
    reviewedAt: content.updatedAt,
    image,
    seo: { title: 'Judul SEO', image },
  }
  const page = toPublicContent('articles', article)
  assert.equal(page.reviewer?.title, doctor.title)
  assert.equal(page.reviewedAt, article.reviewedAt)
  assert.equal(page.image?.url, image.url)
  assert.equal(page.seo?.title, article.seo?.title)
  assert.equal(page.seo?.image?.url, image.url)
})

test('public DTOs exclude workflow, author and future CMS fields at every level', () => {
  const internalDoctor = { ...doctor, author: 99, privateNotes: 'internal', reviewHash: 'internal' }
  const internalService = {
    ...service,
    reviewer: internalDoctor,
    reviewHash: 'internal',
    author: 99,
  }
  const article: Article = {
    ...content,
    author: 99,
    reviewHash: 'internal',
    reviewer: internalDoctor,
    services: [internalService],
    publishedAt: content.createdAt,
  }
  const published = toPublicContent('articles', article)
  const option = toPublicSchedule({
    ...schedule,
    location,
    doctor: internalDoctor,
    service: internalService,
  })
  const serialized = JSON.stringify({ published, option })
  for (const field of [
    'author',
    'reviewHash',
    'privateNotes',
    '_status',
    'createdAt',
    'reviewState',
  ]) {
    assert(!serialized.includes(`"${field}":`), field)
  }
  assert.deepEqual(
    Object.keys(option).sort(),
    ['id', 'day', 'start', 'end', 'fee', 'doctor', 'location', 'service'].sort(),
  )
  assert.equal(option.doctor.specialty, doctor.specialty)
  assert.equal(option.location.latitude, location.latitude)
  assert.equal(published.reviewer?.title, doctor.title)
  assert.equal(article.author, 99)
})
