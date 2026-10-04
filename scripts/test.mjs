import 'dotenv/config'
import { randomBytes } from 'node:crypto'
import { spawn } from 'node:child_process'
import { cp, mkdir, rm, symlink } from 'node:fs/promises'
import { createServer } from 'node:net'
import path from 'node:path'
import pg from 'pg'

const projectDir = process.cwd()
const runId = randomBytes(6).toString('hex')
const databaseName = `clinic_test_${runId}`
const runDir = path.join(projectDir, '.local', 'test-runs', runId)
const databaseUrl = new URL(process.env.TEST_DATABASE_ADMIN_URL || process.env.DATABASE_URL || '')
const adminUrl = new URL(databaseUrl)
adminUrl.pathname = '/postgres'
const admin = new pg.Client({ connectionString: adminUrl.href })
const children = new Set()
const mode = process.argv[2] || 'all'
if (
  ![
    'all',
    'integration',
    'browser',
    'admin',
    'workflow',
    'email',
    'visual',
    'visual-baseline',
  ].includes(mode)
)
  throw Error(`Unknown test suite: ${mode}`)

async function freePort() {
  const server = createServer()
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const port = server.address().port
  await new Promise((resolve) => server.close(resolve))
  return port
}
const port = await freePort()
const emailPort = await freePort()
databaseUrl.pathname = `/${databaseName}`
const env = {
  ...process.env,
  NODE_ENV: 'production',
  CI: 'true',
  NEXT_TELEMETRY_DISABLED: '1',
  CLINIC_TEST_RUN: runId,
  CLINIC_VISUAL_DIR: path.join(projectDir, '.local', 'visual-comparison'),
  DATABASE_URL: databaseUrl.href,
  NEXT_PUBLIC_SITE_URL: `http://127.0.0.1:${port}`,
  TEST_BASE_URL: `http://127.0.0.1:${port}`,
  TEST_EMAIL_PORT: String(emailPort),
  NEXT_PUBLIC_DEMO_MODE: 'true',
  PAYLOAD_SECRET: randomBytes(32).toString('hex'),
  CRON_SECRET: randomBytes(32).toString('hex'),
  SEED_ADMIN_EMAIL: `admin-${runId}@example.test`,
  SEED_ADMIN_PASSWORD: randomBytes(24).toString('hex'),
  MEDIA_DIR: path.join(runDir, 'media'),
  SMTP_HOST: '',
  SMTP_USER: '',
  SMTP_PASSWORD: '',
  ADMIN_EMAIL: '',
  META_ACCESS_TOKEN: '',
  NEXT_PUBLIC_META_PIXEL_ID: '',
  NEXT_PUBLIC_GA_ID: '',
  WHATSAPP_NUMBER: '',
}
function start(command, args, stdio = 'inherit') {
  const child = spawn(command, args, { cwd: runDir, env, stdio })
  children.add(child)
  child.once('exit', () => children.delete(child))
  return child
}
let interrupted = false
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    interrupted = true
    void stopChildren()
  })
}
async function run(command, args) {
  if (interrupted) throw Error('Test run interrupted')
  const child = start(command, args)
  const timeout = setTimeout(() => child.kill('SIGTERM'), 180000)
  child.once('exit', () => clearTimeout(timeout))
  await new Promise((resolve, reject) => {
    child.once('error', reject)
    child.once('exit', (code) =>
      code === 0 ? resolve() : reject(Error(`${command} ${args.join(' ')} exited with ${code}`)),
    )
  })
}
async function stopChildren() {
  await Promise.all(
    [...children].map(
      (child) =>
        new Promise((resolve) => {
          child.once('exit', resolve)
          child.kill('SIGTERM')
          const timeout = setTimeout(() => child.kill('SIGKILL'), 5000)
          timeout.unref()
          child.once('exit', () => clearTimeout(timeout))
        }),
    ),
  )
}
let databaseCreated = false
try {
  await admin.connect()
  await admin.query(`CREATE DATABASE "${databaseName}"`)
  databaseCreated = true
  await mkdir(runDir, { recursive: true })
  for (const name of [
    'src',
    'scripts',
    'tests',
    'public',
    'package.json',
    'package-lock.json',
    'next.config.mjs',
    'next-env.d.ts',
    'tsconfig.json',
    'tsconfig.check.json',
    'playwright.config.ts',
  ]) {
    await cp(path.join(projectDir, name), path.join(runDir, name), { recursive: true })
  }
  const nativePageDir = path.join(runDir, 'src/app/(public)/uji-route-file')
  await mkdir(nativePageDir, { recursive: true })
  await cp(
    path.join(runDir, 'tests/fixtures/native-page.tsx'),
    path.join(nativePageDir, 'page.tsx'),
  )
  await symlink(path.join(projectDir, 'node_modules'), path.join(runDir, 'node_modules'), 'dir')
  await run('npm', ['run', 'migrate'])
  await run(process.execPath, ['--import', 'tsx', 'tests/fixtures/seed.ts'])
  await run('npm', ['run', 'build'])
  const server = start(
    process.execPath,
    ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', String(port)],
    'pipe',
  )
  let serverLog = ''
  server.stdout.on('data', (chunk) => {
    serverLog = (serverLog + chunk).slice(-12000)
  })
  server.stderr.on('data', (chunk) => {
    serverLog = (serverLog + chunk).slice(-12000)
  })
  let ready = false
  for (let attempt = 0; attempt < 120; attempt++) {
    if (server.exitCode !== null) throw Error(`Test server stopped: ${serverLog}`)
    try {
      if ((await fetch(env.TEST_BASE_URL + '/api/users/me')).ok) {
        ready = true
        break
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  if (!ready) throw Error(`Test server did not become ready: ${serverLog}`)
  const suites = mode === 'all' ? ['integration', 'browser', 'workflow', 'email', 'admin'] : [mode]
  for (const suite of suites) {
    console.log(`\nRunning ${suite} against ${databaseName}`)
    if (suite === 'integration')
      await run(process.execPath, ['--import', 'tsx', '--test', 'tests/integration/clinic.test.ts'])
    else if (suite === 'browser')
      await run('npm', ['exec', '--', 'playwright', 'test', '--workers=1'])
    else if (suite === 'visual' || suite === 'visual-baseline')
      await run(process.execPath, [
        '--import',
        'tsx',
        'scripts/verify-visual.ts',
        ...(suite === 'visual-baseline' ? ['--update'] : []),
      ])
    else await run(process.execPath, ['--import', 'tsx', `scripts/verify-${suite}.ts`])
  }
} finally {
  await stopChildren()
  if (databaseCreated) await admin.query(`DROP DATABASE "${databaseName}" WITH (FORCE)`)
  await admin.end()
  // Only this run's generated copy is removed; the working application is untouched.
  await rm(runDir, { recursive: true, force: true })
}
