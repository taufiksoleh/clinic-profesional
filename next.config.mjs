import { withPayload } from '@payloadcms/next/withPayload'
const config = withPayload({
  output: 'standalone',
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
})

// The CMS needs a color-scheme hint; public pages use a fixed theme and must not
// restart their first request to negotiate the admin theme.
const payloadHeaders = config.headers
config.headers = async () =>
  (await payloadHeaders()).map((rule) =>
    rule.headers.some((header) => header.key === 'Critical-CH')
      ? { ...rule, source: '/admin/:path*' }
      : rule,
  )
export default config
