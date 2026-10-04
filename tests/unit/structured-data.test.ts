import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getDoctorSchema, getLocationSchema, getArticleSchema } from '../../src/lib/structured-data'
import { toPublicContent } from '../../src/lib/content'

const content = {
  id: 1,
  title: 'Konten uji',
  slug: 'konten-uji',
  summary: 'Ringkasan',
  createdAt: '2026-10-04T00:00:00Z',
  updatedAt: '2026-10-04T00:00:00Z',
}

test('each feature keeps its structured data and canonical path', () => {
  const doctor = toPublicContent('doctors', { ...content, specialty: 'Rehabilitasi' })
  const location = toPublicContent('locations', {
    ...content,
    city: 'Jakarta',
    address: 'Alamat',
    hours: '09:00–17:00',
    latitude: -6.2,
    longitude: 106.8,
  })
  const article = toPublicContent('articles', { ...content, publishedAt: content.createdAt })
  assert.equal(getDoctorSchema(doctor)['@type'], 'Person')
  assert.equal(getDoctorSchema(doctor).jobTitle, 'Rehabilitasi')
  assert(getDoctorSchema(doctor).url.endsWith('/dokter/konten-uji'))
  assert.deepEqual(getLocationSchema(location).geo, {
    '@type': 'GeoCoordinates',
    latitude: -6.2,
    longitude: 106.8,
  })
  assert.equal(getArticleSchema(article)['@type'], 'Article')
  assert.equal(getArticleSchema(article).datePublished, content.createdAt)
})
