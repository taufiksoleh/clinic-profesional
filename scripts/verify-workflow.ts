import { requireTestEnvironment } from '../tests/helpers/environment'
import 'dotenv/config'
import assert from 'node:assert/strict'
import { getPayload, createLocalReq } from 'payload'
import config from '../src/payload.config'
requireTestEnvironment()
if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true')
  throw Error('Hanya boleh diuji pada lingkungan demo.')
const p = await getPayload({ config })
const admin = (
  await p.find({ collection: 'users', where: { role: { equals: 'admin' } }, limit: 1 })
).docs[0]
const doctor = (await p.find({ collection: 'doctors', limit: 1 })).docs[0]
const req = await createLocalReq({ user: { ...admin, collection: 'users' } }, p)
const slug = 'workflow-' + Date.now()
let id: number | undefined
let writerId: number | undefined
try {
  const draft = await p.create({
    collection: 'articles',
    req,
    data: {
      title: 'Workflow test article',
      slug,
      summary: 'Testing the publication workflow.',
      sections: [{ heading: 'Section', text: 'Original medically reviewed content.' }],
      seo: {
        title: 'Workflow test article title for publishing',
        description:
          'Description for verifying medical approval and scheduled publication through the complete workflow.',
      },
      reviewState: 'pending',
      _status: 'draft',
      publishedAt: new Date().toISOString(),
    },
  })
  id = draft.id
  await assert.rejects(
    p.update({ collection: 'articles', id, req, data: { _status: 'published' } }),
  )
  await p.update({
    collection: 'articles',
    id,
    req,
    data: { reviewer: doctor.id, reviewState: 'approved' },
  })
  const writer = await p.create({
    collection: 'users',
    data: {
      email: `${slug}@example.test`,
      password: crypto.randomUUID(),
      name: 'Workflow test writer',
      role: 'writer',
    },
  })
  writerId = writer.id
  const writerReq = await createLocalReq({ user: { ...writer, collection: 'users' } }, p)
  await assert.rejects(
    p.jobs.queue({
      task: 'schedulePublish',
      input: {
        doc: { relationTo: 'articles', value: id },
        type: 'publish',
        user: { relationTo: 'users', value: writer.id },
      },
      overrideAccess: false,
      req: writerReq,
      waitUntil: new Date(Date.now() - 1000),
    }),
  )
  const job = await p.jobs.queue({
    task: 'schedulePublish',
    input: {
      doc: { relationTo: 'articles', value: id },
      type: 'publish',
      user: { relationTo: 'users', value: admin.id },
    },
    overrideAccess: false,
    req,
    waitUntil: new Date(Date.now() - 1000),
  })
  const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/cron`, {
    headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
  })
  assert.equal(response.status, 200, await response.clone().text())
  const published = await p.findByID({ collection: 'articles', id })
  assert.equal(published._status, 'published')
  assert.equal(published.reviewState, 'approved')
  assert(published.reviewedAt)
  const changed = await p.update({
    collection: 'articles',
    id,
    req,
    data: { sections: [{ heading: 'Section', text: 'Changed content needs a new review.' }] },
  })
  assert.equal(changed._status, 'draft')
  assert.equal(changed.reviewState, 'pending')
  assert.equal(changed.reviewedAt, null)
  const read = await p.find({
    collection: 'articles',
    overrideAccess: false,
    where: { id: { equals: id } },
  })
  assert.equal(read.docs.length, 0)
  await p.update({
    collection: 'articles',
    id,
    req,
    data: { reviewer: doctor.id, reviewState: 'approved' },
  })
  await p.update({
    collection: 'articles',
    id,
    req,
    data: { _status: 'published', slug: slug + '-new' },
  })
  const redirect = await p.find({
    collection: 'redirects',
    where: { from: { equals: '/blog/' + slug } },
    limit: 1,
  })
  assert.equal(redirect.docs[0]?.to, '/blog/' + slug + '-new')
  await p.delete({ collection: 'redirects', id: redirect.docs[0].id })
  await p.delete({ collection: 'payload-jobs', id: job.id }).catch(() => {})
  console.log(
    'PASS: medical gate, writer scheduling denial, real cron publication, review invalidation, anonymous access, automatic redirect.',
  )
} finally {
  if (id) await p.delete({ collection: 'articles', id })
  if (writerId) await p.delete({ collection: 'users', id: writerId })
  await p.destroy()
}
process.exit(0)
