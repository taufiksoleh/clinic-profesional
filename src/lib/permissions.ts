import type { User } from '@/payload-types'

type PermissionUser = Pick<User, 'role'> | null | undefined
export const role = (user: PermissionUser) => user?.role
export const isAdministrator = (user: PermissionUser) => role(user) === 'admin'
export const canAccessAdmin = (user: PermissionUser) =>
  !!user && ['admin', 'seo', 'writer', 'medical'].includes(user.role)
export const canPublishContent = (user: PermissionUser) =>
  role(user) === 'admin' || role(user) === 'seo'
export const canReviewMedicalContent = (user: PermissionUser) =>
  role(user) === 'admin' || role(user) === 'medical'
export const canManageBookings = (user: PermissionUser) =>
  role(user) === 'admin' || role(user) === 'seo'
export const canExportBookings = (user: PermissionUser) => canManageBookings(user)
export const canRunSEOAudit = (user: PermissionUser) =>
  role(user) === 'admin' || role(user) === 'seo'
export const canManageContent = (user: PermissionUser) =>
  role(user) === 'admin' || role(user) === 'seo'
export const canEditAllContent = (user: PermissionUser) =>
  canPublishContent(user) || canReviewMedicalContent(user)
