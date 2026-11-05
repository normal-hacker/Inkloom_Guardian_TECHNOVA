import { NextRequest, NextResponse } from 'next/server';

const requestIdPattern = /^[A-Za-z0-9._:-]{1,128}$/;

const PROTECTED_ROUTES = ['/dashboard', '/content', '/guidelines', '/insights', '/audit'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Check protected page routes
  const isProtected = PROTECTED_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const sessionCookie = request.cookies.get('inkloom_session')?.value;

  if (isProtected && !sessionCookie) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Request ID tracking & Security headers
  const suppliedId = request.headers.get('x-request-id');
  const requestId =
    suppliedId && requestIdPattern.test(suppliedId)
      ? suppliedId
      : crypto.randomUUID();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.set('X-Request-ID', requestId);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
