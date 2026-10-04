import 'dotenv/config'
if (!process.env.CRON_SECRET) throw Error('CRON_SECRET wajib diisi.')
const response = await fetch(`http://127.0.0.1:${process.env.PORT || '3000'}/api/cron`, {
  headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
  signal: AbortSignal.timeout(55000),
})
if (!response.ok && response.status !== 409) throw Error(`Cron gagal: HTTP ${response.status}`)
console.log(await response.text())
