import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
const email = process.env.BOOTSTRAP_ADMIN_EMAIL
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD
if (!email || !password || password.length < 16)
  throw Error('Atur BOOTSTRAP_ADMIN_EMAIL dan BOOTSTRAP_ADMIN_PASSWORD (minimal 16 karakter).')
const p = await getPayload({ config })
const existing = await p.count({ collection: 'users', where: { role: { equals: 'admin' } } })
if (existing.totalDocs)
  throw Error('Admin sudah tersedia. Buat pengguna baru melalui admin yang ada.')
await p.create({
  collection: 'users',
  data: { email, password, name: 'Administrator', role: 'admin' },
})
console.log('Akun admin dibuat. Hapus BOOTSTRAP_ADMIN_PASSWORD dari environment setelah selesai.')
await p.destroy()
process.exit(0)
