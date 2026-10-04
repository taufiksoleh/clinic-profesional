import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { User } from '../../src/payload-types'
import {
  canAccessAdmin,
  canPublishContent,
  canReviewMedicalContent,
  canManageBookings,
  canExportBookings,
  canRunSEOAudit,
  canEditAllContent,
  isAdministrator,
} from '../../src/lib/permissions'

const capabilities = [
  canAccessAdmin,
  canPublishContent,
  canReviewMedicalContent,
  canManageBookings,
  canExportBookings,
  canRunSEOAudit,
  canEditAllContent,
  isAdministrator,
]
const expected: Record<User['role'], boolean[]> = {
  admin: [true, true, true, true, true, true, true, true],
  seo: [true, true, false, true, true, true, true, false],
  medical: [true, false, true, false, false, false, true, false],
  writer: [true, false, false, false, false, false, false, false],
}
for (const [role, permissions] of Object.entries(expected)) {
  test(`${role} permissions stay consistent across UI, API and CMS adapters`, () => {
    assert.deepEqual(
      capabilities.map((check) => check({ role: role as User['role'] })),
      permissions,
    )
  })
}
test('anonymous users have no staff capabilities', () => {
  for (const user of [null, undefined]) assert(capabilities.every((check) => !check(user)))
})
