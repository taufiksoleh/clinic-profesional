import type { ReactNode } from 'react'
import { categories } from '@/lib/constants'
import type { Content } from '@/lib/content'
import { jsonLd } from '@/lib/seo'
import { getContentSchema } from '@/lib/structured-data'
import { BookingCTA } from './BookingCTA'
import { Breadcrumb } from './Breadcrumb'

export function ContentPage({
  doc: document,
  category,
  eyebrow = 'Klinik Ruang Gerak',
  headerExtra,
  children,
  afterContent,
  hasSchedules = false,
  schema = getContentSchema(document, category),
}: {
  doc: Content
  category?: string
  eyebrow?: string
  headerExtra?: ReactNode
  children?: ReactNode
  afterContent?: ReactNode
  hasSchedules?: boolean
  schema?: Record<string, unknown>
}) {
  return (
    <>
      <article className="container section">
        <Breadcrumb
          items={[
            ...(category ? [{ label: categories[category].title, href: `/${category}` }] : []),
            { label: document.title, href: `/${category ? category + '/' : ''}${document.slug}` },
          ]}
        />
        <header className="detail-header">
          <span className="eyebrow">{eyebrow}</span>
          <h1>{document.title}</h1>
          <p>{document.summary}</p>
          {headerExtra}
        </header>
        {document.image?.url && (
          <img
            className="detail-image"
            src={document.image.sizes?.hero?.url || document.image.url}
            alt={document.image.alt}
            width={1200}
            height={650}
          />
        )}
        <div className="article-layout">
          <aside className="toc">
            <strong>Di halaman ini</strong>
            {document.sections?.map((section, i) => (
              <a key={i} href={`#bagian-${i}`}>
                {section.heading}
              </a>
            ))}
            {hasSchedules && <a href="#jadwal">Jadwal & biaya</a>}
            {!!document.faqs?.length && <a href="#faq">Pertanyaan umum</a>}
          </aside>
          <div className="prose">
            {document.sections?.map((section, i) => (
              <section id={`bagian-${i}`} key={i}>
                <h2>{section.heading}</h2>
                {section.text.split('\n\n').map((text, j) => (
                  <p key={j}>{text}</p>
                ))}
                {section.links?.map((link) => (
                  <p key={link.href}>
                    <a className="text-link" href={link.href}>
                      {link.label}
                    </a>
                  </p>
                ))}
              </section>
            ))}
            {children}
            {!!document.faqs?.length && (
              <section id="faq">
                <h2>Pertanyaan umum</h2>
                {document.faqs.map((faq, i) => (
                  <details className="faq" key={i}>
                    <summary>{faq.question}</summary>
                    <p>{faq.answer}</p>
                  </details>
                ))}
              </section>
            )}
          </div>
        </div>
        {afterContent}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />
        {!!document.faqs?.length && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: jsonLd({
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: document.faqs.map((faq) => ({
                  '@type': 'Question',
                  name: faq.question,
                  acceptedAnswer: { '@type': 'Answer', text: faq.answer },
                })),
              }),
            }}
          />
        )}
      </article>
      {!['kebijakan-privasi'].includes(document.slug) && <BookingCTA />}
    </>
  )
}
