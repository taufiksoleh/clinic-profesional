import { getPublicConfig } from '@/lib/public-config'
import { z } from 'zod'

export function getEmailNotificationConfig() {
  if (!process.env.SMTP_HOST || !process.env.ADMIN_EMAIL) return undefined
  return { recipient: z.email().parse(process.env.ADMIN_EMAIL) }
}

export function getMetaNotificationConfig() {
  if (!process.env.META_ACCESS_TOKEN) return undefined
  return {
    token: process.env.META_ACCESS_TOKEN,
    pixelId: z.string().regex(/^\d+$/).parse(getPublicConfig().metaPixelId),
    apiVersion: z
      .string()
      .regex(/^v\d+\.\d+$/)
      .parse(process.env.META_API_VERSION),
  }
}

export function getSMTPConfig() {
  if (!process.env.SMTP_HOST) return undefined
  const port = z.coerce
    .number()
    .int()
    .min(1)
    .max(65535)
    .parse(process.env.SMTP_PORT || 587)
  return {
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  }
}
