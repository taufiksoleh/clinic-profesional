import { jsonLd } from '@/lib/seo'
import { getSiteUrl } from '@/lib/site'
import Link from 'next/link'
export function Breadcrumb({ items }: { items: { label: string; href: string }[] }) {
  return (
    <>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Beranda</Link>
        {items.map((item) => (
          <span key={item.href}>
            {' '}
            / <Link href={item.href}>{item.label}</Link>
          </span>
        ))}
      </nav>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [{ label: 'Beranda', href: '/' }, ...items].map((item, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: item.label,
              item: getSiteUrl() + item.href,
            })),
          }),
        }}
      />
    </>
  )
}
