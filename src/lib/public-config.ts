import { z } from 'zod'

export const publicConfigSchema = z.object({
  siteUrl: z
    .url()
    .refine((value) => {
      const url = new URL(value)
      return (
        ['http:', 'https:'].includes(url.protocol) &&
        !url.username &&
        !url.password &&
        url.pathname === '/' &&
        !url.search &&
        !url.hash
      )
    }, 'NEXT_PUBLIC_SITE_URL harus berupa origin HTTP(S) tanpa path atau kredensial.')
    .transform((value) => new URL(value).origin),
  demoMode: z.enum(['true', 'false']).transform((value) => value === 'true'),
  googleAnalyticsId: z
    .string()
    .regex(/^G-[A-Z0-9]+$/)
    .optional(),
  metaPixelId: z.string().regex(/^\d+$/).optional(),
})

export function getPublicConfig() {
  // Next replaces these literal public variable accesses when building the browser bundle.
  return publicConfigSchema.parse({
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    demoMode: process.env.NEXT_PUBLIC_DEMO_MODE || 'false',
    googleAnalyticsId: process.env.NEXT_PUBLIC_GA_ID || undefined,
    metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID || undefined,
  })
}
