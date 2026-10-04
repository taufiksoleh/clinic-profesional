import type { Content, DoctorProfile, ClinicLocation, ArticleDetail } from './content'
import { getSiteUrl } from './site'

export function getContentSchema(document: Content, category?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: document.title,
    headline: document.title,
    description: document.summary,
    url: `${getSiteUrl()}/${category ? category + '/' : ''}${document.slug}`,
    dateModified: document.updatedAt,
  }
}
export function getDoctorSchema(doctor: DoctorProfile) {
  return { ...getContentSchema(doctor, 'dokter'), '@type': 'Person', jobTitle: doctor.specialty }
}
export function getLocationSchema(location: ClinicLocation) {
  return {
    ...getContentSchema(location, 'lokasi'),
    '@type': 'MedicalClinic',
    address: location.address,
    geo: { '@type': 'GeoCoordinates', latitude: location.latitude, longitude: location.longitude },
  }
}
export function getArticleSchema(article: ArticleDetail) {
  return {
    ...getContentSchema(article, 'blog'),
    '@type': 'Article',
    datePublished: article.publishedAt,
    reviewedBy: { '@type': 'Person', name: article.reviewer?.title },
    lastReviewed: article.reviewedAt,
  }
}
