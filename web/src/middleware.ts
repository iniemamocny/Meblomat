import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = process.env.AUTH_SESSION_COOKIE_NAME ?? 'meblomat_session';
const PUBLIC_PATHS = new Set(['/login']);
const PUBLIC_API_PREFIXES = ['/api/auth', '/api/health'];

function isPublicApi(pathname: string) {
  return PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/_next') || pathname.startsWith('/static') || pathname.startsWith('/assets')) {
    return NextResponse.next();
  }

  if (isPublicApi(pathname) || pathname.startsWith('/api/preview')) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  if (pathname === '/favicon.ico' || pathname === '/robots.txt') {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    const redirectTarget = pathname + (request.nextUrl.search ?? '');
    if (redirectTarget && redirectTarget !== '/login') {
      loginUrl.searchParams.set('redirectTo', redirectTarget);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
};
