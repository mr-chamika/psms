import { Permission } from './permissions'
import { ROLE_PERMISSIONS, UserRole } from './roles'

export function normalizeRole(role: unknown): UserRole | null {
  if (typeof role !== 'string') return null
  return (Object.values(UserRole) as string[]).includes(role) ? (role as UserRole) : null
}

export function getPermissionsForRole(role: unknown): Permission[] {
  const normalized = normalizeRole(role)
  if (!normalized) return []
  return ROLE_PERMISSIONS[normalized] ?? []
}

export function hasPermission(role: unknown, permission: Permission): boolean {
  if (!permission) return false
  const perms = getPermissionsForRole(role)
  return perms.includes(permission)
}

export function hasAnyPermission(role: unknown, permissions: Permission[]): boolean {
  const perms = getPermissionsForRole(role)
  return permissions.some((p) => perms.includes(p))
}
