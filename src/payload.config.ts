import { getSiteUrl } from './lib/site'
import { getSMTPConfig } from './server/config'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { Bookings } from './collections/Bookings'
import { Articles, Doctors, Locations, News, Pages, Services } from './collections/content'
import { Media } from './collections/Media'
import { NotFoundLogs } from './collections/NotFoundLogs'
import { Redirects } from './collections/Redirects'
import { Schedules } from './collections/Schedules'
import { Settings } from './collections/Settings'
import { Users } from './collections/Users'
import { canPublishContent } from './lib/permissions'
const dirname = path.dirname(fileURLToPath(import.meta.url))
const smtpOptions = getSMTPConfig()
export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || '',
  serverURL: getSiteUrl(),
  admin: {
    user: 'users',
    importMap: { baseDir: dirname },
    components: { beforeDashboard: ['/components/AdminOverview#AdminOverview'] },
  },
  collections: [
    Users,
    Doctors,
    Locations,
    Services,
    Schedules,
    Articles,
    News,
    Pages,
    Media,
    Bookings,
    Redirects,
    NotFoundLogs,
  ],
  globals: [Settings],
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL },
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  editor: lexicalEditor(),
  sharp,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  upload: { limits: { fileSize: 8 * 1024 * 1024 } },
  ...(smtpOptions
    ? {
        email: nodemailerAdapter({
          defaultFromAddress: process.env.SMTP_FROM || 'noreply@example.com',
          defaultFromName: 'Admin Klinik',
          transportOptions: smtpOptions,
        }),
      }
    : {}),
  jobs: {
    access: {
      queue: ({ req: request }) => canPublishContent(request.user),
      cancel: ({ req: request }) => canPublishContent(request.user),
      run: ({ req: request }) =>
        request.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}` &&
        !!process.env.CRON_SECRET,
    },
  },
})
