export const ROLE_PATH_PREFIXES = [
  'admin',
  'editor',
  'photographer',
  'receptionist',
] as const

export type RolePathPrefix = (typeof ROLE_PATH_PREFIXES)[number]

export function getFirstPathSegment(pathname: string): string | null {
  const cleaned = (pathname || '/').split('?')[0] || '/'
  const parts = cleaned.split('/').filter(Boolean)
  return parts.length > 0 ? parts[0] : null
}

export function getRolePrefixFromPath(pathname: string): RolePathPrefix | null {
  const first = getFirstPathSegment(pathname)
  if (!first) return null
  return (ROLE_PATH_PREFIXES as readonly string[]).includes(first)
    ? (first as RolePathPrefix)
    : null
}

export function isRoleAuthorizedForPath(args: {
  pathname: string
  role?: string | null
}): boolean {
  const required = getRolePrefixFromPath(args.pathname)
  if (!required) return true
  if (args.role === 'admin') return true
  return args.role === required
}
