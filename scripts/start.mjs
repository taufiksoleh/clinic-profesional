import 'dotenv/config'
import { cp } from 'node:fs/promises'
import path from 'node:path'
const portIndex = process.argv.indexOf('--port')
if (portIndex !== -1) process.env.PORT = process.argv[portIndex + 1]
process.env.PORT ||= '3000'
process.env.MEDIA_DIR ||= path.resolve('media')
process.env.HOSTNAME = process.env.APP_HOST || '127.0.0.1'
await cp('public', '.next/standalone/public', { recursive: true })
await cp('.next/static', '.next/standalone/.next/static', { recursive: true })
await import('../.next/standalone/server.js')
