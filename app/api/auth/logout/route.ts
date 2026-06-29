import { NextResponse } from 'next/server'
import { AUTH_COOKIE_NAME } from '@/lib/auth'

export const runtime = 'nodejs'

function clearAuthCookie(res: NextResponse) {
	res.cookies.set({
		name: AUTH_COOKIE_NAME,
		value: '',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		path: '/',
		maxAge: 0,
	})
}

export async function POST() {
	const res = NextResponse.json({ message: 'Logged out' }, { status: 200 })
	clearAuthCookie(res)
	return res
}

// Optional: allow simple link navigation to log out.
export async function GET(req: Request) {
	const res = NextResponse.redirect(new URL('/login', req.url))
	clearAuthCookie(res)
	return res
}
