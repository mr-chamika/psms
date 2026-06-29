import { NextRequest, NextResponse } from "next/server";
import { isRoleAuthorizedForPath } from "./lib/role-guard";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "./lib/auth";

function isPublicAssetPath(pathname: string): boolean {
  if (pathname.startsWith("/_next/")) return true;
  if (pathname === "/favicon.ico") return true;
  if (pathname === "/robots.txt") return true;
  if (pathname === "/sitemap.xml") return true;
  if (pathname.startsWith("/assets/")) return true;
  return false;
}

function isPublicRoute(req: NextRequest): boolean {
  const { pathname } = req.nextUrl;

  if (pathname === "/" || pathname === "/login" || pathname === "/signup")
    return true;

  if (pathname === "/api/auth/login") return true;

  return false;
}

type EdgeSession = {
  sub?: string
  email?: string
  role?: string | null
}

async function getSession(req: NextRequest): Promise<EdgeSession | null> {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value
  if (!token) return null

  const session = await verifyAuthToken(token)
  if (!session) return null

  return { sub: session.sub, email: session.email, role: session.role }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isApiRequest = pathname.startsWith('/api/')

  if (isPublicAssetPath(pathname) || isPublicRoute(req)) {
    return NextResponse.next();
  }

  // API endpoints are protected inside route handlers via RBAC guards.
  // Keep page guards (login/role redirects) in this proxy for UX.
  if (isApiRequest) {
    return NextResponse.next()
  }

  const session = await getSession(req)
  if (session) {
    const allowed = isRoleAuthorizedForPath({ pathname, role: session.role })
    if (!allowed) {
      // Signal to the layout that access is forbidden via a request header
      const requestHeaders = new Headers(req.headers)
      requestHeaders.set('x-forbidden', 'true')
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        }
      })
    }

    return NextResponse.next()
  }

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", `${pathname}${req.nextUrl.search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/:path*"],
};
