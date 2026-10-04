import { requireTestEnvironment } from '../tests/helpers/environment'
import 'dotenv/config'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { SMTPServer } from 'smtp-server'
import type { AddressInfo } from 'node:net'
requireTestEnvironment()
if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') throw Error('Hanya untuk lingkungan demo.')
const messages: string[] = []
const smtp = new SMTPServer({
  authOptional: true,
  disabledCommands: ['STARTTLS'],
  onAuth(_auth, _session, callback) {
    callback(null, { user: 'test' })
  },
  onData(stream, _session, callback) {
    let text = ''
    stream.on('data', (chunk) => (text += chunk.toString()))
    stream.on('end', () => {
      messages.push(text)
      callback()
    })
  },
})
await new Promise<void>((resolve) => smtp.listen(0, '127.0.0.1', resolve))
const port = (smtp.server.address() as AddressInfo).port
const app = spawn(
  process.execPath,
  [
    'node_modules/next/dist/bin/next',
    'start',
    '--hostname',
    '127.0.0.1',
    '--port',
    process.env.TEST_EMAIL_PORT!,
  ],
  {
    env: {
      ...process.env,
      SMTP_HOST: '127.0.0.1',
      SMTP_PORT: String(port),
      SMTP_USER: 'test',
      SMTP_PASSWORD: 'test',
      SMTP_FROM: 'clinic@example.test',
      ADMIN_EMAIL: 'admin@example.test',
    },
    stdio: 'pipe',
  },
)
let log = ''
app.stdout.on('data', (b) => (log += b.toString()))
app.stderr.on('data', (b) => (log += b.toString()))
const base = `http://127.0.0.1:${process.env.TEST_EMAIL_PORT}`
let token = ''
let bookingID: number | undefined
try {
  let ready = false
  for (let attempt = 0; attempt < 80; attempt++) {
    if (app.exitCode !== null) throw Error('Test server stopped: ' + log)
    try {
      const r = await fetch(base + '/api/users/me')
      if (r.ok) {
        ready = true
        break
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 250))
  }
  assert(ready, 'Test server did not become ready')
  const login = await fetch(base + '/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.SEED_ADMIN_EMAIL,
      password: process.env.SEED_ADMIN_PASSWORD,
    }),
  })
  assert.equal(login.status, 200)
  token = (await login.json()).token
  const schedules = await (await fetch(base + '/api/booking-options')).json()
  const s = schedules[0]
  const date = new Date()
  date.setDate(date.getDate() + 1)
  while (date.getDay() !== s.day) date.setDate(date.getDate() + 1)
  const requestId = crypto.randomUUID()
  const body = {
    requestId,
    name: 'Email integration patient',
    phone: `0814${Math.floor(Math.random() * 1e8)
      .toString()
      .padStart(8, '0')}`,
    date: date.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }),
    scheduleId: s.id,
    consent: true,
  }
  const booking = await fetch(base + '/api/booking', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: process.env.NEXT_PUBLIC_SITE_URL! },
    body: JSON.stringify(body),
  })
  assert.equal(booking.status, 200, await booking.clone().text())
  const { reference } = await booking.json()
  const getRecord = async () => {
    const r = await fetch(`${base}/api/bookings?where[requestId][equals]=${requestId}`, {
      headers: { Authorization: `JWT ${token}` },
    })
    return (await r.json()).docs[0]
  }
  const saved = await getRecord()
  bookingID = saved.id
  assert.equal(saved.notificationStatus, 'pending')
  const cron = () =>
    fetch(base + '/api/cron', { headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` } })
  assert.equal((await cron()).status, 200)
  assert.equal((await getRecord()).notificationStatus, 'sent')
  assert.equal(messages.length, 1)
  assert(messages[0].includes(reference))
  assert(!messages[0].includes(body.phone))
  assert(!messages[0].includes(body.name))
  assert.equal((await cron()).status, 200)
  assert.equal(messages.length, 1)
  console.log(
    'PASS: booking queued email, cron delivered to local SMTP, no patient name/phone in email, repeated cron did not resend.',
  )
} finally {
  if (bookingID)
    await fetch(`${base}/api/bookings/${bookingID}`, {
      method: 'DELETE',
      headers: { Authorization: `JWT ${token}` },
    })
  app.kill('SIGTERM')
  await new Promise<void>((resolve) => {
    if (app.exitCode !== null) resolve()
    else app.once('exit', () => resolve())
  })
  await new Promise<void>((resolve) => smtp.close(resolve))
}
