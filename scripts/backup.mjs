import 'dotenv/config'
import { mkdir, chmod, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'
if (!process.env.DATABASE_URL) throw Error('DATABASE_URL wajib diisi.')
const destination = path.resolve(
  process.env.BACKUP_DIR || '.local/backups',
  new Date().toISOString().replace(/[:.]/g, '-'),
)
await mkdir(destination, { recursive: true, mode: 0o700 })
await chmod(destination, 0o700)
const db = new URL(process.env.DATABASE_URL)
const env = {
  ...process.env,
  PGHOST: db.hostname,
  PGPORT: db.port || '5432',
  PGUSER: decodeURIComponent(db.username),
  PGPASSWORD: decodeURIComponent(db.password),
  PGDATABASE: db.pathname.slice(1),
}
if (db.searchParams.has('sslmode')) env.PGSSLMODE = db.searchParams.get('sslmode')
const dump = spawnSync(
  'pg_dump',
  ['--format=custom', '--file', path.join(destination, 'database.dump')],
  { env, stdio: 'inherit' },
)
if (dump.status !== 0) throw Error('Backup database gagal.')
await mkdir('media', { recursive: true })
const media = spawnSync('tar', ['-czf', path.join(destination, 'media.tar.gz'), 'media'], {
  stdio: 'inherit',
})
if (media.status !== 0) throw Error('Backup media gagal.')
await writeFile(
  path.join(destination, 'manifest.json'),
  JSON.stringify(
    {
      createdAt: new Date().toISOString(),
      format: 1,
      database: 'database.dump',
      media: 'media.tar.gz',
    },
    null,
    2,
  ),
  { mode: 0o600 },
)
console.log(`Backup selesai: ${destination}`)
