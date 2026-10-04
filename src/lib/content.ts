import type {
  Article,
  Config,
  Doctor,
  Location,
  Media,
  News,
  Page,
  Schedule,
  Service,
} from '@/payload-types'

export type ContentCollection = 'doctors' | 'locations' | 'services' | 'articles' | 'news' | 'pages'
export type ContentDocument = Config['collections'][ContentCollection]
export type PublicImage = Pick<Media, 'id' | 'alt' | 'url' | 'width' | 'height' | 'sizes'>
export type Content = Pick<
  Page,
  'id' | 'title' | 'slug' | 'summary' | 'sections' | 'faqs' | 'updatedAt'
> & {
  image?: PublicImage
  seo?: Omit<NonNullable<Page['seo']>, 'image'> & { image?: PublicImage }
}
export type DoctorProfile = Content &
  Pick<Doctor, 'specialty' | 'education' | 'experience' | 'links'> & {
    services: Content[]
  }
export type ClinicLocation = Content &
  Pick<Location, 'city' | 'address' | 'hours' | 'phone' | 'latitude' | 'longitude'>
export type MedicalReview = Pick<Service, 'reviewedAt'> & {
  reviewer?: Pick<Doctor, 'id' | 'title' | 'slug'>
}
export type ServiceDetail = Content & MedicalReview
export type ArticleDetail = Content &
  MedicalReview &
  Pick<Article, 'publishedAt'> & { services: Content[] }
export type NewsDetail = Content & Pick<News, 'publishedAt'>
export type PublicContentByCollection = {
  doctors: DoctorProfile
  locations: ClinicLocation
  services: ServiceDetail
  articles: ArticleDetail
  news: NewsDetail
  pages: Content
}
export type PublicSchedule = Pick<Schedule, 'id' | 'day' | 'start' | 'end' | 'fee'> & {
  doctor: DoctorProfile
  location: ClinicLocation
  service: ServiceDetail
}

export function getRelatedDocument<T extends object>(
  value: T | number | null | undefined,
): T | undefined {
  return value && typeof value === 'object' ? value : undefined
}

function publicImage(value: Media | number | null | undefined): PublicImage | undefined {
  const image = getRelatedDocument(value)
  if (!image) return undefined
  return {
    id: image.id,
    alt: image.alt,
    url: image.url,
    width: image.width,
    height: image.height,
    sizes: image.sizes
      ? {
          card: image.sizes.card
            ? {
                url: image.sizes.card.url,
                width: image.sizes.card.width,
                height: image.sizes.card.height,
              }
            : undefined,
          hero: image.sizes.hero
            ? {
                url: image.sizes.hero.url,
                width: image.sizes.hero.width,
                height: image.sizes.hero.height,
              }
            : undefined,
        }
      : undefined,
  }
}

export function toPublicPage(document: ContentDocument): Content {
  return {
    id: document.id,
    title: document.title,
    slug: document.slug,
    summary: document.summary,
    updatedAt: document.updatedAt,
    sections:
      document.sections?.map(({ heading, text, links }) => ({
        heading,
        text,
        links: links?.map(({ label, href }) => ({ label, href })),
      })) ?? document.sections,
    faqs: document.faqs?.map(({ question, answer }) => ({ question, answer })) ?? document.faqs,
    image: publicImage(document.image),
    seo: document.seo
      ? {
          title: document.seo.title,
          description: document.seo.description,
          canonical: document.seo.canonical,
          noindex: document.seo.noindex,
          image: publicImage(document.seo.image),
        }
      : undefined,
  }
}

export function toPublicDoctor(document: Doctor): DoctorProfile {
  return {
    ...toPublicPage(document),
    specialty: document.specialty,
    education: document.education,
    experience: document.experience,
    links: document.links?.map(({ label, url }) => ({ label, url })),
    services:
      document.services?.flatMap((service) =>
        typeof service === 'object' ? [toPublicPage(service)] : [],
      ) ?? [],
  }
}

export function toPublicLocation(document: Location): ClinicLocation {
  return {
    ...toPublicPage(document),
    city: document.city,
    address: document.address,
    hours: document.hours,
    phone: document.phone,
    latitude: document.latitude,
    longitude: document.longitude,
  }
}

export function toPublicService(document: Service): ServiceDetail {
  const reviewer = getRelatedDocument(document.reviewer)
  return {
    ...toPublicPage(document),
    reviewedAt: document.reviewedAt,
    reviewer: reviewer
      ? { id: reviewer.id, title: reviewer.title, slug: reviewer.slug }
      : undefined,
  }
}

export function toPublicArticle(document: Article): ArticleDetail {
  return {
    ...toPublicService(document),
    publishedAt: document.publishedAt,
    services:
      document.services?.flatMap((service) =>
        typeof service === 'object' ? [toPublicPage(service)] : [],
      ) ?? [],
  }
}

function toPublicNews(document: News): NewsDetail {
  return { ...toPublicPage(document), publishedAt: document.publishedAt }
}

const converters: {
  [C in ContentCollection]: (document: Config['collections'][C]) => PublicContentByCollection[C]
} = {
  doctors: toPublicDoctor,
  locations: toPublicLocation,
  services: toPublicService,
  articles: toPublicArticle,
  news: toPublicNews,
  pages: toPublicPage,
}

export function toPublicContent<C extends ContentCollection>(
  collection: C,
  document: Config['collections'][C],
): PublicContentByCollection[C] {
  return converters[collection](document)
}

export function hasPublishedRelationships(schedule: Schedule): schedule is Schedule & {
  doctor: Doctor
  location: Location
  service: Service
} {
  return (
    getRelatedDocument(schedule.doctor)?._status === 'published' &&
    getRelatedDocument(schedule.location)?._status === 'published' &&
    getRelatedDocument(schedule.service)?._status === 'published'
  )
}

export function toPublicSchedule(
  schedule: Schedule & { doctor: Doctor; location: Location; service: Service },
): PublicSchedule {
  return {
    id: schedule.id,
    day: schedule.day,
    start: schedule.start,
    end: schedule.end,
    fee: schedule.fee,
    doctor: toPublicDoctor(schedule.doctor),
    location: toPublicLocation(schedule.location),
    service: toPublicService(schedule.service),
  }
}
