import { getPublicConfig } from '@/lib/public-config'
import { getSiteUrl } from '@/lib/site'
import type { MetadataRoute } from 'next'
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      ...(getPublicConfig().demoMode
        ? { disallow: '/' }
        : { allow: '/', disallow: ['/admin', '/api'] }),
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  }
}
