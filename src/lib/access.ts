import type { Access, FieldAccess } from 'payload'
import {
  canAccessAdmin,
  canEditAllContent,
  canManageContent,
  canPublishContent,
  isAdministrator,
  role,
} from './permissions'

export const isAdmin: Access = ({ req }) => isAdministrator(req.user)
export const isStaff: Access = ({ req }) => canAccessAdmin(req.user)
export const isManager: Access = ({ req }) => canManageContent(req.user)
export const adminField: FieldAccess = ({ req }) => isAdministrator(req.user)
export const publishedOrStaff: Access = ({ req }) =>
  canAccessAdmin(req.user) ? true : { _status: { equals: 'published' } }
export const editContent: Access = ({ req, data }) => {
  if (data?._status === 'published' && !canPublishContent(req.user)) return false
  if (canEditAllContent(req.user)) return true
  if (role(req.user) === 'writer') return { author: { equals: req.user!.id } }
  return false
}
